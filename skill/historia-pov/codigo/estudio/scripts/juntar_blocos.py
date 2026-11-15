"""JUNTA OS BLOCOS de um episódio num vídeo só e mede o resultado.

Cuidados que este script já faz:
 - corta o som de cada bloco no tamanho exato da imagem (cada render sai com ~0,05 s a mais de som; sem cortar, a voz
   atrasa a cada emenda e a boca sai do tempo);
 - emenda com 3 ms de suavização no som (sem estalo);
 - mede o volume final (-14 LUFS é o alvo) e o pico.
Antes de juntar, meça o ambiente dos dois lados de cada emenda: cada bloco é mixado sozinho e o fundo pode pular.

uso (na pasta estudio/):
  python scripts/juntar_blocos.py <saida.mp4> bloco1.mp4 bloco2.mp4 bloco3.mp4 ...
  python scripts/juntar_blocos.py <saida.mp4> --gancho mestre.mp4 98.5 3.4 bloco1.mp4 ...
     (--gancho arquivo inicio duracao: põe um trecho forte do fim do episódio na frente, para os primeiros 3 a 5 s)
"""
import os, subprocess, sys, tempfile
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

a = sys.argv[1:]
if len(a) < 2:
    sys.exit(__doc__)
saida, resto = a[0], a[1:]
tmp = tempfile.mkdtemp(prefix="juntar_")
def dur_video(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames,r_frame_rate", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip().split(",")
    num, den = map(float, r[0].split("/")); return float(r[1]) / (num / den)
partes, i = [], 0
while i < len(resto):
    if resto[i] == "--gancho":
        f, ini, d = resto[i + 1], float(resto[i + 2]), float(resto[i + 3]); i += 4
        p = os.path.join(tmp, f"p{len(partes):02d}.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ini), "-t", str(d), "-i", f, "-c:v", "libx264", "-crf", "16", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-af", "afade=t=in:d=0.003,afade=t=out:st=%.3f:d=0.003" % (d - 0.003), p], check=True)
        partes.append(p)
    else:
        f = resto[i]; i += 1; d = dur_video(f)
        p = os.path.join(tmp, f"p{len(partes):02d}.mp4")
        tem_som = bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip())
        if not tem_som:  # cartão sem som (ex.: CartaoTexto): põe silêncio para a emenda funcionar
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-t", "%.4f" % d, p], check=True)
            print(f"{os.path.basename(f)}: {d:.3f} s (sem som: silêncio)"); partes.append(p); continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f, "-c:v", "copy", "-af", "atrim=0:%.4f,afade=t=in:d=0.003,afade=t=out:st=%.4f:d=0.003" % (d, d - 0.003), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-t", "%.4f" % d, p], check=True)
        print(f"{os.path.basename(f)}: {d:.3f} s")
        partes.append(p)
lst = os.path.join(tmp, "lista.txt")
open(lst, "w").write("\n".join(f"file '{p.replace(os.sep, '/')}'" for p in partes))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", saida], check=True)
e = subprocess.run(["ffmpeg", "-i", saida, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
res = [l.strip() for l in e[e.rfind("Summary:"):].splitlines() if l.strip().startswith(("I:", "Peak:"))]
print(f"\nok: {saida} ({dur_video(saida):.2f} s) | " + " | ".join(res))
