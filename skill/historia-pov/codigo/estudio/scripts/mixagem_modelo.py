"""MIXAGEM-MODELO de um bloco: vozes + ambiente + efeitos + música, cada coisa no segundo certo.
Copie este arquivo para scripts/<historia>_som_<bloco>.py e troque a parte "SUA CENA" no fim.

Só comece o som com a IMAGEM TRAVADA (aprovada). Ordem: Openverse CC0 primeiro (scripts/buscar_sons.py), depois
colocar cada som no momento certo, depois o Earshot para escolher, conferir e preencher o que faltar.

Peças:
  carrega(arquivo, filtro_ffmpeg, ini, dur)  lê um som (mono, 48 kHz) já com filtro, trecho opcional
  filtra(som, filtro_ffmpeg)                 aplica um filtro ffmpeg num som já carregado
  fade(som, entrada_s, saida_s)              suaviza as pontas (evita estalos nas emendas)
  Trilha(duracao).poe(som, t0, ganho_db, env=..., voz=True)   coloca um som no tempo
  Trilha.env([(t, dB), ...])                 curva de volume no tempo (ex.: o ambiente some no susto)
  Trilha.salva(saida.mp3)                    -14 LUFS (redes sociais), pico abaixo de -1 dB, com ganho fixo + limitador
  Trilha.relatorio()                         mede a distância entre a voz e o resto (anote os números; você não ouve)

Filtros prontos (ffmpeg):
  MEGAFONE  alto-falante velho / corneta      RADIO  rádio de carro / walkie-talkie      CELULAR  áudio saindo do celular
  CASA      um pouco de eco de dentro de casa  ABAFADO  som atrás de uma porta ou parede

uso (na pasta estudio/): python scripts/<historia>_som_<bloco>.py
"""
import os, subprocess, tempfile, json
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np

SR = 48000
MEGAFONE = "highpass=f=500,lowpass=f=3300,equalizer=f=1700:t=q:w=1.2:g=8,volume=9dB,asoftclip=type=atan,highpass=f=450,lowpass=f=3500,aecho=0.85:0.55:110|240|420:0.32|0.2|0.12"
RADIO = "highpass=f=350,lowpass=f=3000,equalizer=f=1500:t=q:w=1:g=6,asoftclip=type=atan"
CELULAR = "highpass=f=600,lowpass=f=4000,equalizer=f=2000:t=q:w=1:g=5"
CASA = "aecho=0.8:0.5:35|70:0.25|0.15"
ABAFADO = "lowpass=f=700,volume=-4dB"

def carrega(f, af=None, ini=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(ini)] if ini else []) + (["-t", str(dur)] if dur else []) + ["-i", f]
    if af: cmd += ["-af", af]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

def filtra(s, af):
    p = os.path.join(tempfile.gettempdir(), "mix_filtra.raw"); s.astype("<f4").tofile(p)
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", p, "-af", af, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).copy()

def db(x): return 10 ** (x / 20)

def fade(s, a=0.01, b=0.05):
    s = s.copy(); na, nb = max(1, int(a * SR)), max(1, int(b * SR)); s[:na] *= np.linspace(0, 1, na); s[-nb:] *= np.linspace(1, 0, nb); return s

def loop(s, dur):
    """repete um ambiente até cobrir `dur` segundos (com emenda suave)"""
    n = int(dur * SR); out = np.zeros(n, np.float32); x = fade(s, 0.3, 0.3); passo = max(1, len(x) - int(0.3 * SR)); i = 0
    while i < n: k = min(len(x), n - i); out[i:i + k] += x[:k]; i += passo
    return out

def camera_lenta(s, ritmo=0.55):
    """som de câmera lenta: mais lento e mais grave (use no ambiente e nos efeitos; as VOZES ficam normais)"""
    return filtra(s, f"asetrate={SR}*{ritmo},aresample={SR},lowpass=f=2500")

class Trilha:
    def __init__(self, fim):
        self.fim = fim; self.mix = np.zeros(int(fim * SR), np.float32); self.voz = np.zeros_like(self.mix)
    def env(self, pontos):
        t = np.arange(len(self.mix)) / SR; ts, vs = zip(*sorted(pontos)); return db(np.interp(t, ts, vs)).astype(np.float32)
    def poe(self, som, t0, g=0.0, env=None, voz=False):
        i = int(t0 * SR); s = som[: max(0, len(self.mix) - i)] * db(g)
        if env is not None: s = s * env[i:i + len(s)]
        self.mix[i:i + len(s)] += s
        if voz: self.voz[i:i + len(s)] += s
        return len(som) / SR
    def relatorio(self):
        def rms_db(x): x = x[np.abs(x) > 1e-5]; return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else -99
        resto = self.mix - self.voz
        on = np.abs(self.voz) > 1e-4
        print(f"voz {rms_db(self.voz):.1f} dB | resto durante a voz {rms_db(resto[on]):.1f} dB | diferença {rms_db(self.voz) - rms_db(resto[on]):.1f} dB (de 15 a 30 dB funcionou bem)")
    def salva(self, saida):
        os.makedirs(os.path.dirname(os.path.abspath(saida)), exist_ok=True)
        raw = os.path.join(tempfile.gettempdir(), "mix_final.raw"); self.mix.astype("<f4").tofile(raw)
        base = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw]
        # ganho fixo + limitador a -1 dB (não infla os silêncios); mede o resultado e corrige o ganho até chegar a -14 LUFS
        def mede(args):
            e = subprocess.run(["ffmpeg", "-hide_banner", *args, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
            return float([l for l in e[e.rfind("Summary:"):].splitlines() if l.strip().startswith("I:")][0].split()[1])
        I0 = mede(["-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw]); ganho = -14.0 - I0
        for _ in range(4):
            subprocess.run(base + ["-af", f"volume={ganho:.2f}dB,alimiter=limit=0.89:level=false", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "192k", saida], check=True)
            I = mede(["-i", saida])
            if abs(I + 14.0) < 0.3: break
            ganho += -14.0 - I
        print(f"ok: {saida} ({self.fim} s) volume final {I:.1f} LUFS (antes {I0:.1f}), ganho {ganho:+.1f} dB. Confira com: earshot measure \"{saida}\"")

if __name__ == "__main__":
    # ================= SUA CENA (exemplo; troque os arquivos e os tempos) =================
    # SOM = "../historias/minha-serie/som"
    # t = Trilha(30.5)
    # n = len(t.mix)
    # noite = carrega(f"{SOM}/sfx/noite_grilos.mp3", "lowpass=f=2500,loudnorm=I=-18")
    # t.poe(loop(noite, t.fim), 0, -26, t.env([(0, 0), (11.9, 0), (12.0, -40), (13.5, -40), (14.5, 0), (30.5, 0)]))  # silêncio no susto
    # t.poe(carrega("../historias/minha-serie/episodios/ep01/bloco1/bloco1-vozes.mp3"), 0, 0, voz=True)
    # t.poe(fade(carrega(f"{SOM}/sfx/porta_batida.mp3")), 4.4, -6)
    # t.poe(carrega(f"{SOM}/sfx/radio_locutor.wav", RADIO), 8.0, -8)
    # t.relatorio()
    # t.salva("public/minha-serie/ep01-bloco1-mix-v1.mp3")
    print(__doc__)
