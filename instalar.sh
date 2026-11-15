#!/usr/bin/env bash
# Instalador do historias-pov para Mac (e Linux).
# Uso (Terminal):  curl -fsSL https://raw.githubusercontent.com/nexcorsair-create/skill-pov-3d/main/instalar.sh | bash
#   ou, na pasta baixada:  bash instalar.sh
# Opções: --pasta <pasta de trabalho>  --com-earshot  --sim (não pergunta)  --sem-teste
# O que faz: instala o que falta (Node.js, ffmpeg, Python, faster-whisper), copia a skill para o Claude,
# cria a pasta de trabalho com o estúdio e faz um teste. Não pede nem guarda nenhuma chave.
set -euo pipefail

PASTA="${HPOV_PASTA:-$HOME/HistoriasPOV}"
PASTA_SKILLS="${HPOV_SKILLS:-$HOME/.claude/skills}"
REPO="${HPOV_REPO:-nexcorsair-create/skill-pov-3d}"
ORIGEM=""; EARSHOT="${HPOV_EARSHOT:-}"; SIM="${HPOV_SIM:-}"; SEMTESTE="${HPOV_SEMTESTE:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --pasta) PASTA="$2"; shift 2 ;;
    --skills) PASTA_SKILLS="$2"; shift 2 ;;
    --origem) ORIGEM="$2"; shift 2 ;;
    --com-earshot) EARSHOT=1; shift ;;
    --sim) SIM=1; shift ;;
    --sem-teste) SEMTESTE=1; shift ;;
    *) echo "opção desconhecida: $1"; exit 1 ;;
  esac
done

passo() { printf "\n\033[36m==> %s\033[0m\n" "$1"; }
ok() { printf "    \033[32mok:\033[0m %s\n" "$1"; }
aviso() { printf "    \033[33matenção:\033[0m %s\n" "$1"; }
falha() { printf "\n\033[31mERRO: %s\033[0m\nNada foi apagado. Veja 'Quando algo dá errado' no guia PDF ou no README.\n" "$1"; exit 1; }
tem() { command -v "$1" >/dev/null 2>&1; }
SO="$(uname -s)"

# ---------- 1. o que já existe ----------
passo "Conferindo o que já está instalado"
FALTA=()
if tem node && [ "$(node -v | sed 's/v//; s/\..*//')" -ge 20 ]; then ok "Node.js $(node -v)"; else FALTA+=("node"); fi
if tem ffmpeg; then ok "ffmpeg"; else FALTA+=("ffmpeg"); fi
PY=""
for c in python3.12 python3 python; do
  if tem "$c" && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then PY="$c"; break; fi
done
if [ -n "$PY" ]; then ok "$($PY --version)"; else FALTA+=("python"); fi
if [ -n "$EARSHOT" ] && ! tem git; then FALTA+=("git"); fi

GERENCIADOR=""
if [ ${#FALTA[@]} -gt 0 ]; then
  if [ "$SO" = "Darwin" ]; then GERENCIADOR="brew"
  elif tem apt-get; then GERENCIADOR="apt"
  elif tem dnf; then GERENCIADOR="dnf"
  else falha "não sei instalar programas neste sistema. Instale à mão: ${FALTA[*]}"; fi
fi

# ---------- 2. a única pergunta ----------
echo
echo "Vou fazer o seguinte:"
if [ "$GERENCIADOR" = "brew" ] && ! tem brew; then echo "  - instalar o Homebrew (gerenciador de programas do Mac; vai pedir a senha do Mac)"; fi
for f in "${FALTA[@]+"${FALTA[@]}"}"; do echo "  - instalar $f ($GERENCIADOR)"; done
echo "  - instalar o faster-whisper (transcrição de voz, grátis; baixa ~1,6 GB na primeira transcrição)"
[ -n "$EARSHOT" ] && echo "  - instalar o Earshot em $HOME/tools/earshot (~2 GB)"
echo "  - copiar a skill 'historia-pov' para $PASTA_SKILLS"
echo "  - criar a pasta de trabalho $PASTA (estúdio + histórias) e instalar o estúdio (~400 MB)"
[ -z "$SEMTESTE" ] && echo "  - fazer um teste rápido (um quadro do vídeo de exemplo)"
echo "Nenhuma chave é pedida ou guardada. Leva de 5 a 20 minutos, conforme a internet."
if [ -z "$SIM" ]; then
  printf "Confirma a instalação? [S/n] "
  read -r R < /dev/tty || R=""
  case "$(echo "$R" | tr '[:upper:]' '[:lower:]')" in ""|s|sim|y|yes) ;; *) echo "Instalação cancelada. Nada foi alterado."; exit 0 ;; esac
fi

# ---------- 3. programas ----------
if [ ${#FALTA[@]} -gt 0 ]; then
  passo "Instalando: ${FALTA[*]}"
  if [ "$GERENCIADOR" = "brew" ]; then
    if ! tem brew; then
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" < /dev/tty
      [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
      [ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
    fi
    for f in "${FALTA[@]}"; do case "$f" in python) brew install python@3.12 ;; *) brew install "$f" ;; esac; done
  elif [ "$GERENCIADOR" = "apt" ]; then
    sudo apt-get update
    for f in "${FALTA[@]}"; do case "$f" in node) sudo apt-get install -y nodejs npm ;; python) sudo apt-get install -y python3 python3-pip python3-venv ;; *) sudo apt-get install -y "$f" ;; esac; done
  else
    for f in "${FALTA[@]}"; do case "$f" in node) sudo dnf install -y nodejs npm ;; python) sudo dnf install -y python3 python3-pip ;; *) sudo dnf install -y "$f" ;; esac; done
  fi
fi
tem node || falha "o Node.js não foi encontrado depois da instalação. Feche o Terminal, abra outro e rode de novo."
tem ffmpeg || falha "o ffmpeg não foi encontrado depois da instalação. Feche o Terminal, abra outro e rode de novo."
if [ -z "$PY" ]; then for c in python3.12 python3 python; do if tem "$c"; then PY="$c"; break; fi; done; fi
[ -n "$PY" ] || falha "o Python não foi encontrado depois da instalação. Feche o Terminal, abra outro e rode de novo."

# ---------- 4. arquivos do pacote ----------
passo "Pegando os arquivos do pacote"
if [ -z "$ORIGEM" ]; then
  AQUI="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
  if [ -n "$AQUI" ] && [ -f "$AQUI/skill/historia-pov/SKILL.md" ]; then ORIGEM="$AQUI"
  else
    case "$REPO" in SEU-USUARIO*) falha "este instalador ainda não sabe de onde baixar (endereço do repositório não definido). Baixe a pasta do pacote e rode 'bash instalar.sh' de dentro dela." ;; esac
    TMP="$(mktemp -d)"; curl -fsSL "https://github.com/$REPO/archive/refs/heads/main.tar.gz" | tar -xz -C "$TMP"
    ORIGEM="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"
  fi
fi
SKILL_SRC="$ORIGEM/skill/historia-pov"
[ -f "$SKILL_SRC/SKILL.md" ] || falha "não achei a skill em $SKILL_SRC."
ok "arquivos em $ORIGEM"

# ---------- 5. a skill ----------
passo "Copiando a skill para o Claude"
mkdir -p "$PASTA_SKILLS"
DEST="$PASTA_SKILLS/historia-pov"
if [ -d "$DEST" ]; then BK="$DEST.antiga-$(date +%Y%m%d-%H%M%S)"; mv "$DEST" "$BK"; aviso "a skill antiga foi guardada em $BK"; fi
cp -R "$SKILL_SRC" "$DEST"
ok "$DEST"

# ---------- 6. pasta de trabalho ----------
passo "Criando a pasta de trabalho"
ESTUDIO="$PASTA/estudio"; CODIGO="$SKILL_SRC/codigo/estudio"
mkdir -p "$PASTA/historias"
if [ ! -d "$ESTUDIO" ]; then cp -R "$CODIGO" "$ESTUDIO"; ok "estúdio novo em $ESTUDIO"
else
  for p in src/kit src/exemplo scripts; do mkdir -p "$ESTUDIO/$p"; cp -R "$CODIGO/$p/." "$ESTUDIO/$p/"; done
  for p in package.json tsconfig.json .env.example; do cp "$CODIGO/$p" "$ESTUDIO/$p"; done
  aviso "o estúdio já existia: atualizei só as peças do pacote (kit, exemplo, scripts). Suas histórias e sua chave não foram tocadas."
fi
[ -f "$PASTA/CLAUDE.md" ] || cp "$SKILL_SRC/codigo/CLAUDE.md" "$PASTA/CLAUDE.md"

passo "Instalando o estúdio (Remotion + three.js)"
( cd "$ESTUDIO" && npm install --no-fund --no-audit ) || falha "o 'npm install' falhou. Confira a internet e rode de novo."
ok "estúdio instalado"

passo "Preparando o navegador interno do Remotion (~100 MB, só na primeira vez)"
if ( cd "$ESTUDIO" && node scripts/preparar_navegador.mjs ); then ok "navegador interno"
else aviso "o navegador interno não ficou pronto; o teste pode falhar. Peça ajuda ao Claude mostrando a mensagem acima."; fi

# ---------- 7. Python ----------
passo "Instalando o faster-whisper e as bibliotecas de som"
"$PY" -m pip install --user --upgrade --disable-pip-version-check faster-whisper numpy pillow 2>/dev/null \
  || "$PY" -m pip install --user --upgrade --break-system-packages --disable-pip-version-check faster-whisper numpy pillow \
  || falha "o pip não conseguiu instalar o faster-whisper."
ok "faster-whisper"

# ---------- 8. Earshot (opcional) ----------
if [ -n "$EARSHOT" ]; then
  passo "Instalando o Earshot (opcional)"
  ES="$HOME/tools/earshot"
  [ -d "$ES" ] || git clone https://github.com/Leonxlnx/earshot "$ES"
  ( cd "$ES" && "$PY" -m venv .venv && .venv/bin/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu \
    && .venv/bin/python -m pip install -e ".[mcp]" && .venv/bin/earshot doctor )
  ok "Earshot em $ES (comando: $ES/.venv/bin/earshot)"
fi

# ---------- 9. teste ----------
if [ -z "$SEMTESTE" ]; then
  passo "Teste rápido: um quadro do vídeo de exemplo"
  ( cd "$ESTUDIO" && node scripts/quadros.mjs Exemplo out/teste/exemplo- 300 0.4 ) || true
  if [ -f "$ESTUDIO/out/teste/exemplo-0300.jpg" ]; then ok "o 3D funciona: $ESTUDIO/out/teste/exemplo-0300.jpg"
  else aviso "o teste não gerou a imagem. O resto foi instalado; peça ajuda ao Claude mostrando a mensagem acima."; fi
fi

printf "\n\033[32mPRONTO!\033[0m\n"
echo "1. Abra o Claude (Claude Code) na pasta: $PASTA"
echo "2. Peça: monta uma história"
echo "3. A chave da ElevenLabs só é necessária na etapa das vozes; o Claude explica como criar o arquivo .env.local sozinho."
