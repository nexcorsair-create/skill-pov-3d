# 6. Som

## Ordem (sempre)

1. **Imagem travada primeiro.** O som vem por último, quando o bloco não muda mais.
2. **Voz** gravada e encaixada no tempo (já feita na etapa das vozes).
3. **Efeitos: Openverse CC0 primeiro** (`buscar_sons.py`) → colocar cada som no momento certo → **Earshot** para escolher o melhor, achar o trecho limpo, conferir e preencher o que faltar (banco de efeitos próprio).
4. **Ambiente e música** por baixo, sem cobrir a voz.
5. **Volume final ~-14 LUFS**, pico abaixo de -1 dB, com ganho fixo + limitador (não use normalização automática, que infla os silêncios). A `Trilha.salva()` do `mixagem_modelo.py` já faz.
6. **Medir** e anotar os números. Você não ouve: quem julga é a pessoa. Diga quais escolhas são mais arriscadas para ela ouvir primeiro.

## Música

- **Nunca baixar música comercial** (YouTube, Spotify, TikTok).
- Use só: faixa **CC0** (Openverse/Freesound), faixa original gerada (ElevenLabs Music, no site, com o plano que permite uso comercial) ou arquivo que a pessoa tenha licença para usar.
- No terror, muitas vezes uma textura grave de fundo (drone) faz o papel da música; pode até ser gerada por código.
- Anote a origem de **todo** som em `historias/<h>/som/CREDITS.md` (o `buscar_sons.py` já anota).

## O que funcionou

- **Um efeito em quase todo corte e ação:** porta, passo, vibração do celular na madeira, tecido, respiração. Passos variados no ritmo dos pés.
- **Sustos tirando o som:** silêncio total por 1 a 1,5 s quando algo para no meio; motor em marcha lenta quando a música para de vez.
- **Câmera lenta:** o ambiente e os efeitos desaceleram junto com a imagem (mais lentos e graves: `camera_lenta()`), o coração entra; **as vozes ficam normais**.
- **Rádio e alto-falante:** voz limpa + filtro na mixagem (`RADIO`, `MEGAFONE`, `CELULAR`), com falhas e chiado feitos na mixagem.
- **Distância voz x resto:** de 15 a 30 dB entre as falas e os efeitos funcionou (`Trilha.relatorio()`).
- **Emendas:** 3 ms de suavização para não estalar; ambiente contínuo na emenda; meça o fundo dos dois lados de cada emenda antes de juntar os blocos (pode pular uns 7 dB).
- **Mudança só no som não precisa de render:** junte a mixagem nova ao vídeo já renderizado:
  `ffmpeg -i bloco.mp4 -i mix-v2.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest bloco-v2.mp4`
- **Gravação famosa tem dono:** refaça com voz nova e efeito na mixagem, nunca a gravação original.

## Earshot (o "ouvido" do Claude)

Programa grátis e de código aberto (licença MIT) que mede e descreve áudio. Instalação em [08-ferramentas-e-custos.md](08-ferramentas-e-custos.md). Comandos mais usados:

| Comando | Para quê |
|---|---|
| `earshot measure arquivo` | Volume exato (LUFS), pico, ruído de fundo |
| `earshot rank pasta "descrição"` | Escolher o melhor entre vários sons |
| `earshot find arquivo "descrição"` | Achar o melhor trecho de uma gravação longa |
| `earshot describe arquivo` | O que o som parece (e se parece real) |
| `earshot timeline video.mp4` | O que acontece quando (sincronia com a imagem) |
| `earshot sfx list` / `earshot sfx render` | Banco de efeitos prontos, gerados no tempo certo |
| `earshot sheet video.mp4` | Imagem com quadros, espectrograma e eventos (para olhar a sincronia) |

Sem o Earshot: escolha o som pelo título e corte pelo volume medido no ffmpeg, e avise que essa parte não foi conferida.

Medir a faixa inteira depois de cada montagem pega erros que você não ouviria (por exemplo, 16 minutos de silêncio no fim, ou um trecho cortado saindo mudo).
