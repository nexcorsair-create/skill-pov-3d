# 9. Segundo idioma e episódio 2

## Segundo idioma (só depois do primeiro 100% aprovado)

É uma **versão própria**, não uma dublagem apressada:

- **A imagem não muda.** Cada fala nova começa no mesmo segundo da original; só se acelera (mantendo o tom, até 1,30x) a fala que não cabe antes da próxima. Assim não se refaz animação nem câmera.
- **Traduza pensando no tempo**, não só no sentido: frase do mesmo tamanho da original evita acelerar (26 falas couberam com no máximo 1,14x; 35 com no máximo 1,22x).
- A fala pode se sobrepor à seguinte **tanto quanto a original já se sobrepunha** (conversa animada); só acelera o que passa disso.
- **Uma chave de idioma no código** (`definirIdioma`, `T(pt, es)`): placas, celular, avisos e cartão trocam sozinhos. A versão original continua igual, sem risco.
- **Mixagem reaproveitada:** os mesmos efeitos, trocando só a faixa de vozes. Custo zero, som aprovado intacto.
- **Valores de verdade:** moeda e medidas convertidas (não só o símbolo). Para os EUA e o México, dólar e galão coerentes.
- **O tratamento muda conforme quem fala com quem** ("señor", "joven", "oye", "muchacho"): uma palavra só para todos soa falsa.
- **A palavra do voto precisa servir em todos os países do idioma.** Use a palavra que já está no cartão.
- Escreva no espanhol do público (mexicano, neutro): vocabulário e jeito de falar de lá.
- Procure textos escritos direto no código (interjeições, rótulos), não só no roteiro.
- Vozes: busque no idioma certo e filtre pelo **sotaque**; escolher sem amostras economiza (as reservas ficam no `vozes.json`).

## Episódio 2 em diante

- **Abre no último quadro do anterior**, com o selo "PARTE N", sem "no episódio anterior".
- **Recapitula repetindo a última fala** (ou uma frase que resume tudo), em no máximo 7 s.
- **Resolve o voto até o 8º segundo**, por uma fala curta ou uma ação; e a escolha **nunca resolve o problema** (abre um novo).
- **Quem chega pelo episódio 2 entende pelos diálogos:** o motivo e a regra aparecem dentro da cena nos primeiros 30 s.
- **Flashback** (cena antiga mudando de sentido): só no meio, 10 a 15 s, com cara de outra época. Lembrança precisa de tempo e de imagem, não só de voz.
- **Confira o último quadro do episódio anterior objeto por objeto** (a lata na mão, a porta aberta, a bateria do celular), não só o enquadramento.
- Se houver votação de verdade, o episódio seguinte só começa depois do resultado: escreva os dois caminhos em uma linha cada, e desenvolva só o vencedor.
- Uma regra nova por episódio, no máximo duas. Um callback de algo do episódio anterior.
- O tempo da história passa de forma coerente (relógio, bateria, distância percorrida).
