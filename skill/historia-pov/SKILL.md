---
name: historia-pov
description: Cria séries curtas em primeira pessoa (POV) para TikTok, Reels e Shorts, com personagens em estilo desenho num mundo 3D, da ideia até o episódio 1 completo (roteiro, vozes, animação, som, legendas e montagem), por etapas com aprovação. Use quando a pessoa pedir "monta uma história", "cria uma série", "quero um vídeo de terror em primeira pessoa", "história POV com votação nos comentários", "faz o episódio 1", ou quiser continuar uma história já começada com esta skill.
---

# História POV: da ideia ao episódio 1

Você vai conduzir uma pessoa (que provavelmente **não é programadora**) da ideia até o episódio 1 pronto para postar: um vídeo vertical em primeira pessoa, com mãos na tela, personagens em estilo desenho num mundo 3D, vozes com emoção, som, legenda e um cartão de voto no fim.

Este método foi tirado de três séries reais feitas assim. O que prendeu e o que perdeu público está nos guias.

## Como falar com a pessoa

- **No idioma dela, em linguagem simples, em termos de vídeo** ("a câmera vira para a porta", "a voz entra aos 6 segundos"), nunca em termos de código.
- **Uma decisão por vez.** Cada etapa termina com algo para ela ver ou ouvir e uma pergunta clara: aprova ou quer mudar?
- **Nada avança sem aprovação.** Anote cada aprovação no `ESTADO.md` da história, com a data.
- **Depois de duas rejeições seguidas da mesma coisa, pare e pergunte** o que está errado, em vez de adivinhar de novo.
- **Você não ouve nem vê movimento.** Meça (volume, duração, quadros), mostre os números e diga o que não deu para verificar. Quem julga é a pessoa.
- **Diga o custo em créditos antes** de qualquer coisa que gaste, e guarde tudo que foi pago (os scripts têm cache).
- **Nunca abra, mostre ou peça a chave** da ElevenLabs no chat. Os scripts leem sozinhos do `.env.local`.
- **Nada é publicado por você.** Quem posta é a pessoa.

## Passo 0: preparar o estúdio (só na primeira vez)

1. Veja se a pasta de trabalho já tem `estudio/` (instalado pelo `instalar` do repositório). Se não tiver, copie `codigo/estudio/` desta skill para a pasta de trabalho.
2. Confira as ferramentas e diga em uma frase o que falta: `node -v` (20 ou mais), `ffmpeg -version`, `python --version` (3.10 ou mais), `python -c "import faster_whisper"`. O Earshot é opcional. Detalhes e como instalar cada uma: [referencias/08-ferramentas-e-custos.md](referencias/08-ferramentas-e-custos.md).
3. **Pergunte antes de instalar qualquer programa.** Depois, em `estudio/`: `npm install` e `node scripts/preparar_navegador.mjs` (baixa e descompacta o navegador interno do Remotion; sem isso, em alguns computadores o primeiro render fica parado para sempre).
4. Teste rápido (1 minuto, grátis): `node scripts/quadros.mjs Exemplo out/teste/ex- 0,150,300,400 0.4` e mostre os quadros. Se aparecer imagem, o 3D funciona.
5. A chave da ElevenLabs só é necessária na etapa das vozes finais. Quando chegar lá, oriente a pessoa a criar o `estudio/.env.local` a partir do `estudio/.env.example` (passo a passo em [referencias/04-vozes.md](referencias/04-vozes.md)).

## Passo 1: a entrevista (curta)

Faça estas perguntas, no máximo três por mensagem, com sugestões para ela só escolher:

1. **Tema e gênero:** terror, suspense, mistério, comédia sombria? Tem uma ideia ou quer sugestões?
2. **Público:** de que país é a maior parte de quem assiste? (muda a gíria, a moeda e o que é "reconhecível")
3. **Idioma:** qual primeiro? (o segundo idioma vem só depois do primeiro aprovado, como versão própria)
4. **Duração:** 60 a 90 s (mais fácil) ou 110 a 130 s (mais história)?
5. **Quanto quer gastar:** só grátis até o rascunho, ou com vozes da ElevenLabs (veja a tabela de custos)?
6. **Votação:** o público decide de verdade o próximo episódio nos comentários, ou o cartão é só um gancho?

Anote as respostas no `ESTADO.md` (modelo em [modelos/ESTADO.md](modelos/ESTADO.md)). Crie a pasta da história: `historias/<nome-curto>/`.

## Passo 2: ideias

- Se ela já tem uma ideia, desenvolva **a dela**: preencha a ficha da história e mostre os buracos.
- Se não tem, proponha **3 ideias** curtas, cada uma com: lugar comum, quem "você" é, a regra em uma frase, o que dá errado nos primeiros 7 s e a primeira decisão.
- Use a receita e a ficha de [referencias/01-entrevista-e-ideias.md](referencias/01-entrevista-e-ideias.md). Se ela mandar vídeos de referência, assista de verdade (quadros + transcrição + som) antes de propor.
- **Ela escolhe.** Só então siga.

## Passo 3 em diante: o método por etapas

Siga [referencias/02-metodo-por-etapas.md](referencias/02-metodo-por-etapas.md). Resumo:

| # | Etapa | Gasta créditos? | Guia |
|---|---|---|---|
| 1 | Bíblia (regras do mundo, formato, tom) e fichas dos personagens | Não | [modelos/BIBLIA.md](modelos/BIBLIA.md), [modelos/PERSONAGENS-E-VOZES.md](modelos/PERSONAGENS-E-VOZES.md) |
| 2 | Roteiro: **primeiro a abertura (0 a 10 s)**, depois o episódio inteiro, com as contas feitas pelo computador | Não | [referencias/03-abertura-e-roteiro.md](referencias/03-abertura-e-roteiro.md) |
| 3 | Voz de rascunho com a voz do computador, para testar o ritmo | Não | `scripts/voz_rascunho.mjs` |
| 4 | Vozes finais: prévias grátis → escolha → gravação com tags | Sim | [referencias/04-vozes.md](referencias/04-vozes.md) |
| 5 | Animação por blocos de ~30 s: decupagem → versão crua → visual → quadros de teste → render | Não | [referencias/05-animacao-pov.md](referencias/05-animacao-pov.md) |
| 6 | Som, **só com a imagem travada** | Não (CC0) | [referencias/06-som.md](referencias/06-som.md) |
| 7 | Legendas, montagem, controle de qualidade, título, descrição e capa | Não | [referencias/07-legendas-montagem-publicacao.md](referencias/07-legendas-montagem-publicacao.md) |

O episódio 1 está pronto quando a pessoa aprovar o vídeo final montado. Segundo idioma e episódio 2: [referencias/09-outro-idioma-e-continuacao.md](referencias/09-outro-idioma-e-continuacao.md).

## As regras que mais importam (decoradas)

1. **Gancho nos primeiros 3 a 5 s:** abra com um trecho forte do próprio episódio (o perigo visível), depois "MINUTOS ANTES..." e o começo.
2. **Quadro 0 já estranho:** a cena comum com o detalhe errado dentro dela, mãos já fazendo algo, fala já começando.
3. **No máximo duas pessoas nos primeiros 10 s.** Quatro pessoas falando juntas no começo perdeu público.
4. **A regra do mundo em uma frase**, dita e escrita na tela até os 5 s (de preferência, é o título).
5. **Descobrir junto:** acontece, o personagem reage, só depois comenta. A fala nunca antecipa o que vai aparecer.
6. **Câmera lenta ~5 s antes do cartão de voto:** o mundo desacelera; o olhar e as vozes continuam normais. A cena não se resolve antes do voto.
7. **Duas opções que custam alguma coisa**, cada uma com verbo e até 6 palavras, respondíveis com uma palavra.
8. **Legenda em todo vídeo**, sem cobrir o celular, rostos ou avisos.
9. **Vozes de taxa 1, sempre com tags de emoção**, aceleração máxima de **1,30x** (na edição, mantendo o tom).
10. **Som por último**, com a imagem aprovada. Openverse CC0 primeiro, depois Earshot para o que faltar. Final em -14 LUFS.
11. **Primeiro a versão crua** (câmera, ritmo, atuação); o visual final só depois de aprovada.
12. **Meça em vez de "ouvir"**: volume, duração das falas, espaço entre falas, quadros de teste.

Todas as lições, com o motivo de cada uma: [referencias/10-licoes.md](referencias/10-licoes.md). Quando algo der errado: [referencias/11-quando-da-errado.md](referencias/11-quando-da-errado.md).

## Organização dos arquivos

```
<pasta de trabalho>/
  estudio/                      projeto de animação (Remotion + three.js), compartilhado por todas as histórias
    .env.local                  a chave da pessoa (nunca abrir, nunca enviar, nunca versionar)
    src/kit/                    peças prontas: lente, contorno, cor, personagem, braços POV, celular, legenda, avisos, voto
    src/exemplo/                vídeo de exemplo de 15 s (copie para começar)
    src/<historia>/             código de cada história
    scripts/                    vozes, transcrição, som, montagem, controle de qualidade
    public/<historia>/          áudios e imagens que o vídeo usa
  historias/<historia>/         tudo de uma história: ESTADO.md, BIBLIA.md, fichas, roteiros, vozes, som, vídeos
```

Regras entre histórias: cada história só mexe na própria pasta; no `src/Root.tsx`, só acrescente as composições dela. Para reaproveitar algo de outra história, copie.

## Comandos principais (na pasta `estudio/`)

| O quê | Comando |
|---|---|
| Abrir o editor visual (ver o vídeo no navegador) | `npm run studio` |
| Quadros de teste (1 min) | `node scripts/quadros.mjs <Composição> out/teste/q- 0,90,300 0.5` |
| Render do vídeo | `npx remotion render src/index.ts <Composição> out/<nome>.mp4 --codec h264 --crf 18 --gl=angle --timeout=180000 --concurrency=4` |
| Voz de rascunho (grátis) | `node scripts/voz_rascunho.mjs <GRAVACAO.md> <pasta> --lang pt` |
| Simular vozes (grátis) | `node scripts/voz.mjs <GRAVACAO.md> <pasta> --vozes <vozes.json> --simular` |
| Gravar vozes (créditos) | `node --env-file=.env.local scripts/voz.mjs <GRAVACAO.md> <pasta> --vozes <vozes.json> --modo falas` |
| Montar a faixa de vozes | `python scripts/montar_vozes.py <tempos.json> <faixa.mp3>` |
| Tempos das palavras, bocas e conferência das tags | `python scripts/dados_falas.py <tempos.json> <GRAVACAO.md> <faixa.mp3> <falas.json> --vozes <vozes.json>` |
| Buscar sons CC0 | `python scripts/buscar_sons.py "door knock" <pasta-som>` |
| Juntar blocos | `python scripts/juntar_blocos.py <saida.mp4> bloco1.mp4 bloco2.mp4` |
| Controle de qualidade | `python scripts/qa.py <video.mp4> <pasta>` |

Render: rode em segundo plano, guarde o log inteiro em arquivo (nunca filtre a saída com `tail`: a mensagem de erro se perde) e faça um render por vez.
