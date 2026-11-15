"""MONTA A FAIXA DE VOZES de um bloco, com cada fala no segundo certo (só a VOZ, seca; o som vem por último).

Lê um tempos.json:
  { "duracao_s": 30.5,
    "falas": [ { "cod": "F01", "quem": "ANA", "inicio": 0.4, "arquivo": "voz/falas/F01_ANA_take1.wav", "ganho_db": 0, "tom": "sussurrando" }, ... ] }
(o caminho do arquivo é relativo à pasta do tempos.json; "ganho_db" é opcional, ex.: -6 para um rádio ficar atrás)

Coloca cada fala no tempo, completa com silêncio até a duração do bloco e mostra onde as falas se encostam.
Ajuste os inícios no tempos.json e rode de novo até ficar bom (não gasta créditos).

uso (na pasta estudio/): python scripts/montar_vozes.py <tempos.json> <saida.mp3>
"""
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

if len(sys.argv) < 3:
    sys.exit("uso: python scripts/montar_vozes.py <tempos.json> <saida.mp3>")
tempos_path, saida = sys.argv[1], sys.argv[2]
cfg = json.load(open(tempos_path, encoding="utf-8"))
base = os.path.dirname(os.path.abspath(tempos_path))

def dur(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True)
    return float(r.stdout.strip())

falas = sorted(cfg["falas"], key=lambda f: f["inicio"])
entradas, filtros = [], []
for i, f in enumerate(falas):
    caminho = os.path.join(base, f["arquivo"])
    f["dur"] = dur(caminho); f["fim"] = f["inicio"] + f["dur"]
    entradas += ["-i", caminho]
    filtros.append(f"[{i}:a]aresample=44100,volume={f.get('ganho_db', 0)}dB,adelay={int(round(f['inicio'] * 1000))}:all=1[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(falas)))
filtros.append(f"{mix}amix=inputs={len(falas)}:normalize=0,apad=whole_dur={cfg['duracao_s']},atrim=0:{cfg['duracao_s']},loudnorm=I=-16:TP=-1.5[out]")
os.makedirs(os.path.dirname(os.path.abspath(saida)), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", ";".join(filtros), "-map", "[out]", "-ar", "44100", "-ac", "1", "-b:a", "192k", saida], check=True)

print(f"{'fala':5} {'quem':12} {'início':>7} {'fim':>7} {'dura':>6}  folga até a próxima")
for a, b in zip(falas, falas[1:] + [None]):
    folga = (b["inicio"] - a["fim"]) if b else (cfg["duracao_s"] - a["fim"])
    aviso = "  SOBREPÕE (de propósito?)" if folga < 0 else ""
    print(f"{a['cod']:5} {a['quem']:12} {a['inicio']:7.2f} {a['fim']:7.2f} {a['dur']:6.2f}  {folga:5.2f} s{aviso}")
print(f"faixa: {saida} ({cfg['duracao_s']} s)")
