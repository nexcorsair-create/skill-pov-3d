# Gravação: <série>, episódio <N>, bloco <B>

Roteiro de gravação lido pelos scripts `voz_rascunho.mjs` (grátis) e `voz.mjs` (ElevenLabs).
Uma linha por fala na seção "Texto para a voz", no formato:

`> CÓDIGO | INÍCIO-FIM (janela na imagem, em segundos) | QUEM | MEDO 0-4 | texto com tags`

- **Tags de emoção em inglês, entre colchetes**, antes do trecho: `[whispers]`, `[scared]`, `[tired]`, `[crying]`, `[shouting]`, `[sighs]`, `[laughs]`, `[gasps]`, `[nervous]`. Toda fala final vai com tag; sem tag só nas amostras de comparação.
- **Escreva como se fala**: nomes estrangeiros e siglas por fonética (a voz lê o que vê).
- **Marcas de montagem entre chaves** não vão para a voz: `{piscada}`, `{batida na porta}`.
- **Nível de medo** (escala da série): 0 calmo, 1 desconfiado, 2 com medo, 3 apavorado, 4 em pânico.
- A janela é aproximada; o que vale é medir o espaço até a próxima fala depois de gravar.

## Direção de cada fala

| Código | Quem | O que acontece na cena | Como falar |
|---|---|---|---|
| F01 | VOZ NA PORTA | Batidas param; a voz vem de trás da porta | Calmo demais, devagar |
| F02 | VOCÊ | Olhando pela janela, vê o irmão lá fora | Sussurro, a voz falha no fim |

## Texto para a voz

> F01 | 6,2-7,9 | VOZ_NA_PORTA | 1 | [calm] Abre aí. [pause] Sou eu, teu irmão.
> F02 | 8,9-10,8 | VOCE | 3 | [whispers] [scared] Mas... ele tá lá fora.

## Registro de créditos

| Data | O quê | Caracteres | Créditos |
|---|---|---|---|
| | Simulação (`--simular`) | | 0 |
