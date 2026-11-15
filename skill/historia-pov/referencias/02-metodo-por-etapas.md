# 2. O método por etapas

Cada etapa termina com algo que a pessoa vê ou ouve e uma aprovação. Anote tudo no `ESTADO.md` da história.

## Documentar em três lugares

1. `historias/<h>/ESTADO.md`: onde paramos, o que foi aprovado (com data), créditos gastos, próximo passo. **Atualize ao fim de cada sessão.**
2. Um `RESULTADO.md` (ou `LEIA.md`) na pasta de cada versão entregue: o que foi feito, como refazer, o que não deu para verificar.
3. Um arquivo de aprendizados para a pessoa decidir o que vira regra (MANTER / DESCARTAR).

Nunca apague a versão anterior: crie `v2`, `v3`. A pessoa pode querer voltar.

## Etapa 1: bíblia e fichas

- Escreva a bíblia a partir de [../modelos/BIBLIA.md](../modelos/BIBLIA.md): premissa numa frase, a regra, regras do mundo, formato de todo episódio, relógios, tom, jeito de falar, cenários, arco.
- Fichas a partir de [../modelos/PERSONAGENS-E-VOZES.md](../modelos/PERSONAGENS-E-VOZES.md): visual de cada um no estilo do kit, cor, jeito de falar, voz desejada, escala do medo de 0 a 4 com as tags.
- Mostre e espere aprovação. Pequenos ajustes viram v2.

## Etapa 2: roteiro

- **Primeiro só a abertura (0 a 10 s) e a decisão do fim.** Aprovadas, escreva o resto.
- Divida o episódio em **blocos de ~30 s**. Cada bloco vai passar sozinho por voz e animação.
- Faça as contas com o computador (palavras, falas, duração), não de cabeça: uma vez estavam escritas 178 palavras e eram 165.
- Use [../modelos/ROTEIRO.md](../modelos/ROTEIRO.md) e [03-abertura-e-roteiro.md](03-abertura-e-roteiro.md).

## Etapa 3: voz de rascunho (grátis)

- Escreva o `GRAVACAO.md` do bloco ([../modelos/GRAVACAO.md](../modelos/GRAVACAO.md)) e rode `node scripts/voz_rascunho.mjs`.
- Mostre a duração total e as falas que não couberam. Ajuste o texto antes de pagar qualquer voz.
- A voz do computador é lenta e robótica: julgue a ordem e o tempo, não a emoção.

## Etapa 4: vozes finais (créditos)

Por bloco, nesta ordem (detalhes em [04-vozes.md](04-vozes.md)):

| Passo | O quê | Créditos |
|---|---|---|
| B2 | Vozes de quem **estreia** no bloco: busca + página de prévias grátis; a pessoa escolhe ouvindo. Amostras com a frase da série só se ela quiser | Prévias: 0. Amostras: sim |
| B3 | Gravar as falas do bloco (com tags). Refazer só as que ela não aprovar (`--take 2 --so F03`) | Sim |
| B4 | Montar a faixa e medir: cada fala cabe até a próxima? Ajustar os tempos | 0 |

Antes de gravar: `--simular`, diga os caracteres e o custo estimado, espere o "pode".

## Etapa 5: animação, bloco por bloco

Fases (cada uma com aprovação; nenhuma gasta créditos). Detalhes em [05-animacao-pov.md](05-animacao-pov.md).

| Fase | Entrega | A pessoa aprova |
|---|---|---|
| Decupagem | O bloco segundo a segundo pela câmera ([../modelos/DECUPAGEM.md](../modelos/DECUPAGEM.md)) | O que se vê e quando |
| A0 (só no primeiro bloco) | Quadros parados das peças novas: lente, braços, piscada, painel | As mãos "estão ali"? |
| A1 versão crua | O bloco com formas simples, personagens provisórios, vozes, legenda e todos os movimentos de cabeça | Câmera, ritmo, atuação |
| A2 visual | 1 quadro com o acabamento final (contorno, cor, luz, textura) | O visual da série |
| A3 quadros | Um quadro de cada momento do bloco | Antes do render longo |
| A4 render | O vídeo do bloco + controle de qualidade | Bloco com imagem pronta |

As peças comuns (cenário, lente, braços, painel) são feitas no primeiro bloco e reaproveitadas: cada bloco seguinte fica mais rápido.

**Quando a pessoa descreve uma cena em detalhe, ela espera vê-la pronta**, não só o texto. Para falas novas baratas (até uns 50 créditos), avise o custo e já faça.

## Etapa 6: som (imagem travada)

Só depois de a imagem do bloco estar aprovada. Ordem: Openverse CC0 → colocar cada som no momento certo → Earshot para escolher, conferir e preencher. Detalhes em [06-som.md](06-som.md). Mudança só no som não precisa de novo render: junte a mixagem nova ao vídeo já renderizado.

## Etapa 7: legendas, montagem e entrega

Legenda (escolhida na entrevista), juntar blocos, gancho no começo, controle de qualidade, título, descrição e capa. Detalhes em [07-legendas-montagem-publicacao.md](07-legendas-montagem-publicacao.md).

## Antes de cada render longo

- Confira se não há outro render rodando (um por vez).
- Tire quadros de teste dos momentos com texto na tela (1 minuto) antes do render completo (de 8 a 35 minutos, conforme o computador).
- Rode em segundo plano e guarde o log inteiro em arquivo.
