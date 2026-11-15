# 10. Lições aprendidas (com o motivo de cada uma)

Tiradas de três séries POV feitas com este método. Cada uma custou pelo menos uma versão refeita.

## Trabalho com a pessoa

| Lição | Por quê |
|---|---|
| Nada avança sem aprovação; versões numeradas, nunca apagar a anterior | A pessoa pode preferir a v1 depois de ver a v3 |
| Depois de duas rejeições, pare e pergunte o que está errado | Uma cena foi rejeitada três vezes até alguém perguntar; o problema era outro |
| Quando a pessoa descreve uma cena em detalhe, ela espera vê-la pronta | Texto sem a cena feita foi cobrado: "cadê a cena?" |
| Diga o custo antes; cache em tudo que foi pago | Ninguém quer pagar duas vezes a mesma fala |
| Você não ouve nem vê movimento: meça e diga o que não verificou | Medir a faixa pegou 16 minutos de silêncio no fim e um trecho mudo |
| Documente em três lugares (ESTADO, RESULTADO da versão, aprendizados) | A próxima sessão começa sem perder nada |

## História e roteiro

| Lição | Por quê |
|---|---|
| Gancho de 3 a 5 s com o momento mais forte | O episódio calmo no começo perdeu público; com o gancho, foi aprovado |
| Quadro 0 já estranho; no máximo duas pessoas nos primeiros 10 s | Festa com quatro falando junto não prendeu; "você e um cliente" prendeu |
| A regra numa frase, dita e escrita até os 5 s | Aviso de rádio longo e falhado ninguém entendeu, ainda mais em outro idioma |
| Descobrir junto: acontece → reage → comenta | A fala que antecipava o áudio estragou o susto |
| Toda ação perigosa com motivo visível | "Por que ele se escondeu?" Porque alguém olhou para a janela |
| Interrupção quebra o clima aos poucos | Todos calando no mesmo instante pareceu falso |
| Terror coletivo > segredo de família | A versão com segredos ficou confusa |
| Decisão boa é a regra contra o coração | As duas opções custam; uma quebra a regra para salvar alguém |
| O que o público reconhece depende do país | Música viral num país é desconhecida no outro |
| Contas com o computador, não de cabeça | 178 palavras "escritas" eram 165 |
| Câmera lenta ~5 s antes do voto; a cena não se resolve antes | Dá tempo e tensão para decidir |

## Vozes

| Lição | Por quê |
|---|---|
| Só taxa 1; conferir antes de gravar | Voz com multiplicador multiplica a conta |
| Tags em toda fala final | As tags dão a emoção; sem tags, só nas amostras |
| Máximo 1,30x, mantendo o tom | Acima disso a voz soa artificial |
| Escrever por fonética | A voz lê o que vê |
| Prévias grátis antes de amostras pagas | Um bloco inteiro saiu por 176 créditos escolhendo pelas prévias |
| Rádio/alto-falante: gravar limpo, falhar na mixagem | Muda-se a falha sem pagar de novo |
| Gravação famosa tem dono | Faça a sua versão com voz nova |
| Conferir com o Whisper se alguma tag foi lida em voz alta | Acontece, e você não ouviria |

## Animação

| Lição | Por quê |
|---|---|
| Primeiro a versão crua (câmera, ritmo, atuação) | Mudar câmera depois do visual final custa muito mais |
| Personagem plano parece colado no ar: apoiar em 3D de verdade | Rejeitado três vezes até ganhar um móvel 3D com pernas |
| Quadros fora de ordem: tudo calculado a partir do tempo | Um objeto "lembrando" o quadro anterior pulava nas emendas |
| Objeto na mão segue posição E rotação | Só posição deixava o objeto flutuando a cada passo |
| Mão segura pela ponta | Mão no meio cobria a tela do celular |
| Ninguém atravessa porta aberta; porta precisa de espaço para abrir | Personagem passando por dentro da porta do carro |
| Andar em velocidade constante | Frear em cada ponto deixava o andar aos trancos |
| Pintura de fundo vira problema quando a câmera chega perto | Uma porta pintada teve que virar parede de verdade |
| Rosto contra a luz fica escuro; luz na frente de quem fala | Sob a luz do teto, os rostos dos homens sumiam |
| Objeto pequeno some em fundo da mesma cor | Chave escura no tapete preto |
| Ver pela linha do olhar | Pedais certos no 3D, escondidos atrás do painel para quem estava sentado |
| Capô e carro alto escondem coisas | Sentado atrás, o chão só aparece a mais de ~9 m; uma pessoa baixa não vê por cima de um SUV |
| Neblina não pode atravessar o carro/quarto | Deixou tudo esbranquiçado por dentro |
| Contorno medido no tamanho do vídeo | Numa folha de comparação pequena, o contorno parecia fino e enganava |
| "Chapado" é falta de movimento, câmera, objetos e textura | Não era a cor nem o programa |
| Quadros de teste antes do render completo | 1 minuto de quadros contra 30 a 60 minutos de render |
| Um render por vez; log inteiro em arquivo | Filtrar o log com `tail` escondeu a mensagem de erro |

## Som e montagem

| Lição | Por quê |
|---|---|
| Som por último, com a imagem travada | Toda mudança de imagem desloca os efeitos |
| Openverse CC0 → colocação → Earshot | Gravação real primeiro; o banco do Earshot preenche o resto |
| Distância voz x efeitos de 15 a 30 dB | Medido em vez de "ouvido" |
| Ganho fixo + limitador até -14 LUFS | Normalização automática infla os silêncios |
| Cortar o som de cada bloco no tamanho da imagem antes de juntar | Sem cortar, a voz atrasou 0,15 s no último bloco |
| Medir o ambiente dos dois lados de cada emenda | O fundo pulou 7 dB entre dois blocos |
| Mudança só no som não precisa de render | Segundos em vez de minutos |
| Câmera lenta no som também (mais lento e grave), vozes normais | A imagem lenta com som normal não convence |
