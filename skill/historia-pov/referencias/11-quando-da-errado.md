# 11. Quando algo dá errado

Leia a mensagem de erro inteira antes de tentar de novo. Explique para a pessoa em uma frase o que aconteceu e o que você vai fazer.

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `node`, `ffmpeg` ou `python` "não é reconhecido" | Programa não instalado, ou o terminal foi aberto antes da instalação | Instalar (com confirmação) e abrir um terminal novo |
| `chave não encontrada` / erro 401 da ElevenLabs | `.env.local` faltando, com outro nome (`.env.local.txt`) ou chave colada errada | Pedir à pessoa para conferir o arquivo (sem mostrar a chave); no Windows, mostrar as extensões dos arquivos |
| Erro 402 / "quota" / créditos insuficientes | Créditos do mês acabaram | Avisar; esperar a renovação ou mudar de plano (decisão da pessoa) |
| Erro 422 ou voz não encontrada | `voice_id` errado, voz removida da biblioteca ou não liberada no plano | Rodar `conferir_vozes.mjs`; usar a voz reserva do `vozes.json` |
| A voz leu a tag em voz alta | A tag não existe para esse modelo ou foi escrita errada | Trocar por uma tag comum (`[whispers]`, `[scared]`...) e refazer só aquela fala (`--take 2 --so F05`) |
| Fala "PASSA DA JANELA" | Texto longo demais para o tempo da imagem | Encurtar o texto (melhor) ou acelerar até 1,30x |
| Quadro de teste ou render parado no começo, sem erro (às vezes logo depois de "Downloading Chrome Headless Shell") | O navegador interno do Remotion foi baixado mas não descompactado (visto com o Node 26 no Windows) | Parar o processo e rodar `node scripts/preparar_navegador.mjs`; depois tentar de novo |
| Quadro de teste todo preto | Câmera dentro de um objeto, luz faltando, ou erro no 3D | Ver as mensagens `[erro no navegador]`; testar a composição `Exemplo` para saber se é do projeto ou da cena |
| Render muito lento ou travando | Computador sem placa de vídeo, ou outro render rodando | Conferir se há outro render; baixar `--concurrency` para 2; renderizar por blocos |
| `Timeout` no render | Quadro pesado demais | Aumentar `--timeout=300000`; simplificar a cena (menos luzes, menos objetos) |
| Texto em negrito sai em Arial Black no Windows | Fonte | Usar a fonte do kit (`Segoe UI Black`, que cai para Arial no Mac) |
| Voz atrasando a cada emenda | Som de cada bloco um pouco mais longo que a imagem | Juntar com `juntar_blocos.py` (já corta) |
| O fundo "pula" de volume entre blocos | Cada bloco foi mixado sozinho | Medir o ambiente dos dois lados e ajustar o ganho do bloco |
| `faster_whisper` dá erro ao ler o áudio | Pacote `av` incompatível em alguns Windows | Os scripts já leem o áudio pelo ffmpeg; se usar à mão, faça igual |
| Download do modelo do Whisper falha | Internet ou espaço em disco | Tentar de novo; ou `--modelo small` (menor) |
| Openverse não acha nada | Busca em português ou com filtro de categoria | Buscar em inglês, com palavras físicas, sem categoria |
| Openverse "rate limit" | Muitas buscas seguidas | Esperar e buscar com calma |
| Personagem parece flutuar ou colado no ar | Sem apoio 3D | Apoiar em móvel/chão de verdade, conferir os pés |
| Personagem cortado na lateral | Lente olho-de-peixe corta tudo a mais de ~35° | Trazer o personagem para o centro ou girar a cabeça |
| Rosto escuro | Luz atrás do personagem | Luz na frente de quem precisa ser visto |

**Regra geral:** se a mesma coisa falhar duas vezes, pare, explique o que tentou e pergunte antes de seguir. Nunca diga que algo funcionou sem ter conferido.
