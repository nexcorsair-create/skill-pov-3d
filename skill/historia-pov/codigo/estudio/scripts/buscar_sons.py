"""BUSCA E BAIXA SONS REAIS GRÁTIS no Openverse (Freesound, Wikimedia e outros), só com licença CC0 por padrão.
CC0 = domínio público: pode usar, cortar e monetizar sem dar crédito. Mesmo assim, o script anota tudo no CREDITS.md.

uso (na pasta estudio/):
  python scripts/buscar_sons.py "wood door knock" <pasta-som> [--n 5] [--licenca cc0]
Busque em INGLÊS, com descrição física curta ("cloth rustle", "night crickets", "heartbeat slow", "creaky stairs").
Não use o filtro de categoria (volta vazio). O limite sem cadastro é baixo (~100 buscas por dia): busque com calma.
Depois: escolha o melhor com o Earshot (earshot rank <pasta>), ache o trecho limpo (earshot find) e confira (describe).
Nunca use licença NC (não comercial) em vídeo que pode ser monetizado, nem ND se for cortar o som.
"""
import json, os, re, sys, urllib.parse, urllib.request
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

a = sys.argv[1:]
if len(a) < 2:
    sys.exit(__doc__)
def opt(n, d):
    return a[a.index(f"--{n}") + 1] if f"--{n}" in a else d
busca, pasta = a[0], a[1]
n, licenca = int(opt("n", "5")), opt("licenca", "cc0")
os.makedirs(pasta, exist_ok=True)
UA = {"User-Agent": "estudio-historias-pov/1.0 (busca de efeitos sonoros)"}
url = "https://api.openverse.org/v1/audio/?" + urllib.parse.urlencode({"q": busca, "license": licenca, "page_size": max(n * 2, 10)})
dados = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
res = [r for r in dados.get("results", []) if r.get("url")][:n]
if not res:
    sys.exit(f"nada encontrado para '{busca}' com licença {licenca}. Tente outras palavras em inglês.")
creditos = os.path.join(pasta, "CREDITS.md")
novo = not os.path.exists(creditos)
with open(creditos, "a", encoding="utf-8") as c:
    if novo: c.write("# Créditos de som\n\nTodos baixados do Openverse. CC0 = domínio público, crédito não obrigatório.\n\n")
    for r in res:
        ext = os.path.splitext(urllib.parse.urlparse(r["url"]).path)[1] or ".mp3"
        nome = re.sub(r"[^\w-]+", "_", f"{busca}_{r['id'][:8]}")[:60] + ext
        destino = os.path.join(pasta, nome)
        if not os.path.exists(destino):
            try:
                with urllib.request.urlopen(urllib.request.Request(r["url"], headers=UA), timeout=60) as resp, open(destino, "wb") as f: f.write(resp.read())
            except Exception as e:
                print("falhou", r["url"], e); continue
        dur = (r.get("duration") or 0) / 1000
        print(f"{nome}  {dur:.1f} s  {r.get('license')} {r.get('license_version', '')}  \"{r.get('title')}\" de {r.get('creator')}")
        c.write(f"- `{nome}`: \"{r.get('title')}\" de {r.get('creator')} ({r.get('foreign_landing_url')}), licença {r.get('license', '').upper()} {r.get('license_version', '')}\n")
print(f"\nCréditos anotados em {creditos}. Custo: 0")
