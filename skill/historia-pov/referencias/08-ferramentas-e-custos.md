# 8. Ferramentas e custos

## Grátis x pago

| Ferramenta | Para quê | Custo | Observação |
|---|---|---|---|
| **Node.js** (20 ou mais) | Roda o estúdio e os scripts de voz | Grátis | |
| **Remotion + three.js** | Animação 3D e render do vídeo | Grátis para pessoas e empresas pequenas | A licença do Remotion pede licença paga para empresas maiores: veja remotion.dev/license |
| **ffmpeg** | Cortar, juntar, acelerar a voz, filtros, volume | Grátis | |
| **Python** (3.10 ou mais) + numpy | Mixagem, transcrição, controle de qualidade | Grátis | |
| **faster-whisper** | Transcrever falas e pegar o tempo de cada palavra | Grátis, roda no computador | Baixa o modelo na primeira vez (~1,6 GB; ou ~500 MB com `--modelo small`) |
| **Voz do computador** | Voz de rascunho para testar o ritmo | Grátis | Windows: vozes do sistema; Mac: `say` |
| **Openverse** | Efeitos e ambientes reais com licença CC0 | Grátis, sem cadastro | Limite de buscas por dia |
| **Kenney** (kenney.nl) | Modelos 3D (móveis, carros, árvores, cidade) | Grátis (CC0) | Baixar com autorização da pessoa |
| **Earshot** | O "ouvido" do Claude: medir, escolher e conferir sons | Grátis, código aberto (MIT) | Opcional; ~2 GB instalado |
| **ElevenLabs** | Vozes finais com emoção; troca de voz; música | **Pago por créditos** | O único gasto do método |

## Quanto custa um episódio (créditos da ElevenLabs)

Medido em séries reais com o modelo `eleven_v4_turbo` e falas com tags (~0,22 crédito por caractere no plano usado; o valor muda com o plano e o modelo, e o script sempre mostra o custo real):

| Item | Créditos |
|---|---|
| Voz de rascunho | 0 |
| Prévias das vozes (página de busca) | 0 |
| Amostras com a frase da série (opcional) | 150 a 340 por bloco |
| Episódio de 60 a 90 s, um idioma | ~200 a 300 |
| Episódio de ~2 min, um idioma | ~350 a 400 |
| Mesmo episódio no segundo idioma | ~260 a 390 |
| Refazer uma fala (tomada nova) | o tamanho da fala |
| Animação, som CC0, legenda, montagem | 0 |

Um episódio 1 completo, num idioma, sem amostras, ficou entre **200 e 400 créditos**; com amostras, entre **500 e 800**. Antes de gastar, sempre `--simular` e diga a estimativa.

Planos e preços mudam: confira em elevenlabs.io/pricing. Pontos a checar com a pessoa:
- quantos créditos por mês o plano dá;
- se o plano permite **uso comercial** (vídeos monetizados);
- se o plano libera as **vozes da biblioteca pela API** (os scripts usam a API).

## Instalação (a pessoa confirma antes de cada programa)

O instalador do repositório faz tudo com uma confirmação. Para instalar à mão:

| Programa | Windows (PowerShell) | Mac (Terminal, com Homebrew) |
|---|---|---|
| Node.js | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
| ffmpeg | `winget install Gyan.FFmpeg` | `brew install ffmpeg` |
| Python | `winget install Python.Python.3.12` | `brew install python@3.12` |
| faster-whisper | `python -m pip install faster-whisper numpy` | `python3 -m pip install faster-whisper numpy` |
| Estúdio | na pasta `estudio/`: `npm install` | igual |

Depois de instalar, feche e abra o terminal (para o computador achar os programas novos).

**Earshot (opcional):**
```
git clone https://github.com/Leonxlnx/earshot
cd earshot
python -m venv .venv
.venv\Scripts\python -m pip install torch --index-url https://download.pytorch.org/whl/cpu      (Mac: .venv/bin/python)
.venv\Scripts\python -m pip install -e ".[mcp]"
.venv\Scripts\earshot doctor
```
Para o Claude usar como ferramenta, veja o README do Earshot (seção MCP).

**Voz de rascunho no Windows:** se não houver voz no idioma, instalar em Configurações → Hora e idioma → Fala → Adicionar vozes.

## O que o computador precisa

- Windows 10/11 ou macOS recente; 8 GB de memória (16 GB é mais confortável); ~5 GB livres (mais o espaço dos vídeos).
- Placa de vídeo ajuda muito no render, mas não é obrigatória (sem ela, o render fica bem mais lento).
- Internet só para instalar, baixar sons e gerar as vozes.
