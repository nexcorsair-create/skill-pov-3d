# 5. Animação em primeira pessoa (POV)

O estúdio é um projeto Remotion + three.js. Cada vídeo é uma "composição" registrada em `estudio/src/Root.tsx`. Comece copiando `src/exemplo/` para `src/<historia>/` e troque o cenário, a câmera, os avisos e o voto.

## O visual (o que já vem no kit)

| Peça | Arquivo | O que faz |
|---|---|---|
| Lente olho-de-peixe | `kit/lente.ts` | A cara do formato: 62 a 65° do centro ao canto. A câmera precisa usar `fovParaLente(graus)`. Tudo a mais de ~35° para o lado sai do quadro: planeje o cenário para isso |
| Contorno de tinta | `kit/ink.ts` | Linhas nas bordas e dobras do 3D. Estilo "novo": azul-marinho grosso (`color "#1c2340", widthNear 7.5`) |
| Cor final | `kit/grade.ts` | Presets de noite, dia e fim de tarde, com vinheta |
| Texturas, céu, halos, grão | `kit/textura.ts` | Chão e paredes pintados por código, céu noturno, brilho nas lâmpadas, grão de celular à noite |
| Personagem | `kit/personagem.ts` | Montado por peças (`Look`), sombra em 2 tons, rosto desenhado com expressões, poses e passo de caminhada |
| Braços POV | `kit/bracos.ts` | As suas mãos, com a cor da manga do protagonista; mão segurando o celular |
| Celular | `kit/celular.ts` | Tela desenhada quadro a quadro: alerta, conversa, bateria, tela apagada |
| Tempo e câmera | `kit/tempo.ts` | Pontos-chave da cabeça, respiração, câmera lenta do mundo |
| Por cima da imagem | `kit/Avisos.tsx` | Piscada, alerta que vira regra no canto, painel, título, cartão de voto, tela preta |
| Legenda | `kit/Legenda.tsx` | Três estilos (ver guia 7) |
| Idioma | `kit/idioma.ts` | `T("português", "español")` em todo texto de tela |

Modelos 3D prontos e grátis: os kits da **Kenney** (kenney.nl, licença CC0: árvores, móveis, carros, cidade). Baixar só com autorização da pessoa; coloque em `estudio/public/<historia>/modelos/`. Formas simples feitas no código também resolvem muita coisa.

## Câmera = cabeça

- Pontos-chave: em cada tempo, **onde a cabeça está** e **para onde olha** (`camera(CHAVES, t)`), com respiração leve (`balanco`).
- **Sem cortes de câmera.** O tempo passa por uma **piscada** (`<Palpebras>`), que também esconde virada brusca de personagem.
- Andar em velocidade constante entre os pontos do caminho; frear só onde a pessoa para de verdade.
- O ponto para onde a câmera olha **não pode vir de uma peça posicionada depois no mesmo quadro** (a mão, por exemplo): use pontos fixos ou calculados do caminho.
- Câmera colada em outro personagem não funciona (a 60 cm, o ombro enche a tela): fique a pelo menos 90 cm.
- Ver pela linha do olhar antes de posicionar peças: o que está certo no 3D pode ficar escondido atrás de algo para quem está sentado.

## Mãos e objetos

- A manga com a cor do protagonista aparece em quase toda cena: é a identidade dele.
- A mão segura o objeto **pela ponta** (no meio, cobre a tela do celular).
- Objeto na mão segue **posição e rotação** da mão (só a posição faz o objeto "flutuar").
- Pegar algo no ar tem peso: a mão vai, afunda um pouco quando chega e volta.
- Coisa que cai precisa de queda visível e distância: cai, quica, rola para longe, e o personagem vai buscar.
- Porta que abre precisa de espaço: o personagem espera fora do giro, puxa e entra pelo vão. Ninguém atravessa uma porta aberta.

## Personagens

- **Personagem plano parece colado no ar.** Apoie em algo 3D de verdade (cadeira, batente, banco do carro) e confira os pés.
- Estilo: cabeça grande, olhos amendoados grandes, ombros redondos, mãos-luva, cabelo num volume só, contorno grosso, sombra em 2 tons e rosto com sombra leve (sombra forte atravessando o rosto parece sujeira).
- Uma cor de roupa por personagem (a mesma da legenda).
- Todos mexem a cabeça ao falar; reações em momentos diferentes.
- Rosto contra a luz fica escuro: ponha uma luz na frente de quem precisa ser visto.
- Uma ficha técnica gerada do próprio boneco 3D (frente, lado, expressões) ajuda a aprovar antes do episódio.

## Cenário e luz

- O que a câmera vai visitar de perto **não pode ser pintura de fundo** (um dia a câmera chega lá).
- Noite: o lugar seguro bem iluminado; o escuro onde mora o perigo. Lanterna: luz suave perto e longe e um feixe leve na neblina (luz forte apontada para o chão perto da câmera vira um círculo estourado).
- Dia: sol atrás da câmera (senão as fachadas ficam cinza).
- Neblina em camadas não pode atravessar o carro ou o quarto.
- Objeto pequeno some em fundo da mesma cor.
- O vídeo parece "chapado" por falta de **movimento, câmera, objetos e textura**, não por causa da cor: encha o cenário de objetos que contam história e dê textura ao chão e às paredes.

## Regra técnica de ouro

**No render, os quadros saem fora de ordem e ao mesmo tempo.** Nada pode depender do quadro anterior (onde a chave estava, de onde ela saiu): calcule tudo a partir do tempo `t`.

## Câmera lenta na decisão

```ts
const tm = tempoMundo({ ini: 20, fim: 21, ritmo: 0.18 }); // a partir de 20 s, o mundo vai a 18% em 1 s
const w = tm(t);   // use w para pessoas, carros, luzes; use t para a câmera, a legenda e as vozes
```

## Fluxo de cada bloco

1. **Decupagem** aprovada.
2. **Versão crua** (formas simples, personagens provisórios, vozes, legenda, todos os movimentos de cabeça): quadros de teste → render → a pessoa aprova câmera, ritmo e atuação.
3. **Visual**: um quadro com o acabamento final; depois um quadro de cada momento.
4. **Render final** em segundo plano, log inteiro em arquivo, e `qa.py` no resultado.

Antes de mostrar qualquer quadro, confira: personagem cortado na lateral, objeto de outra cena aparecendo, chão cobrindo algo, pés flutuando, rosto escuro, bocas e efeitos fora do tempo, legenda em cima de algo importante.

## Tempo de render

Varia muito com o computador: num PC com placa de vídeo, 2 minutos de vídeo levaram ~8 minutos; num notebook sem placa, 65 s chegaram a levar 30 a 35 minutos. Meça no primeiro bloco e avise antes de cada render longo. **Um render por vez.**
