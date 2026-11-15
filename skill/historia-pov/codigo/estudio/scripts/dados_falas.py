"""TEMPO DE CADA PALAVRA + CONFERÊNCIA DAS VOZES, com o faster-whisper (grátis, roda no computador).

Faz três coisas a partir das falas gravadas de um bloco:
 1. CONFERE se a voz leu alguma TAG em voz alta ("whispers", "sussurrando"...) ou pulou palavras: compara o que o
    Whisper ouviu com o texto do roteiro e avisa as diferenças. Refaça a fala com --take 2 se precisar.
 2. LEGENDA: tempo de cada palavra (texto do roteiro, sem tags; tempo do Whisper), já dividido em pedaços de até
    5 palavras -> falas.json no formato do kit (src/kit/Legenda.tsx). Se o número de palavras não bater, espalha as
    palavras do roteiro pelo tempo da fala e avisa.
 3. BOCAS: volume da faixa quadro a quadro (30 por segundo) -> boca de 0 a 1 em falas.json, para abrir e fechar a boca.

uso (na pasta estudio/):
  python scripts/dados_falas.py <tempos.json> <gravacao.md> <faixa.mp3> <saida.json> --vozes <vozes.json> [--lang pt] [--modelo turbo|small]
O modelo "turbo" (padrão) é o mais preciso e baixa ~1,6 GB na primeira vez; "small" (~500 MB) serve em computador fraco.
Pegadinha conhecida: em alguns Windows o pacote `av` quebra ao ler áudio; por isso o áudio é lido com o ffmpeg.
"""
import json, os, re, subprocess, sys, unicodedata
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np

a = sys.argv[1:]
def opt(n, d=None):
    return a[a.index(f"--{n}") + 1] if f"--{n}" in a else d
pos = [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or not a[i - 1].startswith("--"))]
if len(pos) < 4:
    sys.exit(__doc__)
tempos_p, grav_p, faixa_p, saida_p = pos[:4]
lang = opt("lang", "pt")
MODELOS = {"turbo": "mobiuslabsgmbh/faster-whisper-large-v3-turbo", "small": "small"}
modelo = MODELOS.get(opt("modelo", "turbo"), opt("modelo", "turbo"))
vozes = json.load(open(opt("vozes"), encoding="utf-8")) if opt("vozes") else {}
cfg = json.load(open(tempos_p, encoding="utf-8")); base = os.path.dirname(os.path.abspath(tempos_p))

texto = {}
for l in open(grav_p, encoding="utf-8").read().split("## Texto para a voz")[1].splitlines():
    if l.startswith(">"):
        c = [x.strip() for x in l[1:].split("|")]
        t = re.sub(r"\[[^\]]*\]", " ", "|".join(c[4:])); t = re.sub(r"\{[^}]*\}", " ", t)
        texto[c[0]] = re.sub(r"\s+", " ", t).strip()

def ler(f, sr=16000):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True).stdout
    return np.frombuffer(b, np.float32)
def norm(w):
    w = unicodedata.normalize("NFD", w.lower()); w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]", "", w)

from faster_whisper import WhisperModel
m = WhisperModel(modelo, device="cpu", compute_type="int8")
falas_out, avisos = [], []
for f in cfg["falas"]:
    x = ler(os.path.join(base, f["arquivo"])); dur = len(x) / 16000
    segs, _ = m.transcribe(x, language=lang, word_timestamps=True)
    ws = [w for s in segs for w in s.words]
    roteiro = texto[f["cod"]].split()
    ouvido = [norm(w.word) for w in ws]; esperado = [norm(r) for r in roteiro]
    extras = [w for w in ouvido if w and w not in esperado]
    faltando = [w for w in esperado if w and w not in ouvido]
    if extras or faltando:
        avisos.append(f"{f['cod']} {f['quem']}: ouviu a mais {extras or '-'} | faltou {faltando or '-'}  (Whisper ouviu: {' '.join(w.word.strip() for w in ws)})")
    if len(ws) == len(roteiro):
        par = [(r, w.start) for r, w in zip(roteiro, ws)]
    else:
        t0 = ws[0].start if ws else 0.0; t1 = ws[-1].end if ws else dur
        pesos = [len(r) + 2 for r in roteiro]; tot = sum(pesos); acc = t0; par = []
        for r, p in zip(roteiro, pesos):
            par.append((r, acc)); acc += (t1 - t0) * p / tot
    v = vozes.get(lang, {}).get(f["quem"], {})
    palavras = [[round(f["inicio"] + s, 2), r] for r, s in par]
    fim_fala = f["inicio"] + dur
    # divide em pedaços de até 5 palavras ou na pontuação
    pedacos, cur = [], []
    for p in palavras:
        cur.append(p)
        if p[1].endswith((".", ",", "...", ":", "?", "!")) or len(cur) >= 5:
            pedacos.append(cur); cur = []
    if cur: pedacos.append(cur)
    for k, c in enumerate(pedacos):
        fim = pedacos[k + 1][0][0] - 0.04 if k + 1 < len(pedacos) else fim_fala + 0.35
        falas_out.append({"cod": f["cod"], "quem": v.get("nome", f["quem"].title()), "cor": v.get("cor", "#ffffff"), "tom": f.get("tom", ""), "palavras": c, "fim": round(fim, 2)})
    print(f["cod"], f["quem"], " ".join(f"{r}@{f['inicio'] + s:.2f}" for r, s in par))

falas_out.sort(key=lambda x: x["palavras"][0][0])
for p, q in zip(falas_out, falas_out[1:]):
    p["fim"] = min(p["fim"], q["palavras"][0][0] - 0.04)

y = ler(faixa_p, 48000); n = int(round(cfg["duracao_s"] * 30)); win = 1600
rms = np.array([float(np.sqrt((y[i * win:(i + 1) * win] ** 2).mean())) if len(y[i * win:(i + 1) * win]) else 0.0 for i in range(n)])
ref = np.percentile(rms[rms > 0.005], 90) if (rms > 0.005).any() else 1
boca = np.clip(rms / ref, 0, 1)
json.dump({"duracao_s": cfg["duracao_s"], "falas": falas_out, "boca": [round(float(v), 3) for v in boca]}, open(saida_p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\nok: {len(falas_out)} pedaços de legenda, {n} quadros de boca -> {saida_p}")
if avisos:
    print("\nCONFERIR (a voz pode ter lido uma tag em voz alta ou pulado palavras; às vezes é só o Whisper errando):")
    for x in avisos: print("  " + x)
else:
    print("Nenhuma tag lida em voz alta, nenhuma palavra faltando.")
