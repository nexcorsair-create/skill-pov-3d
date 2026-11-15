# 4. Vozes

## Regras

- **Só vozes de taxa 1** (sem multiplicador). Vozes com multiplicador cobram 2x, 3x ou mais por caractere. Os scripts de busca já filtram; confira de novo antes de cada gravação grande (`conferir_vozes.mjs`).
- **Toda fala final vai com tags de emoção** em inglês, entre colchetes: `[whispers]`, `[scared]`, `[tired]`, `[crying]`, `[shouting]`, `[sighs]`, `[laughs]`, `[gasps]`, `[nervous]`, `[trembling]`. Sem tags só nas amostras de comparação de vozes.
- **Aceleração máxima de 1,30x**, feita depois, na edição, mantendo o tom (`--acel` no `voz.mjs`, que usa o `atempo` do ffmpeg). Mudar o tom só quando for escolha da pessoa.
- **Escreva como se fala:** a voz lê por fonética. Nomes estrangeiros, siglas e marcas vão do jeito que se pronuncia.
- **Custo antes, cache sempre:** rode `--simular`, diga os caracteres e a estimativa, espere o "pode". Tudo que foi pago fica no cache; rodar de novo não paga.
- **Confira depois de gravar:** `dados_falas.py` transcreve com o faster-whisper e avisa se a voz leu uma tag em voz alta ou pulou palavras.

## A chave da ElevenLabs (a pessoa faz sozinha)

Você nunca vê a chave. Oriente assim:

1. Criar a conta em elevenlabs.io e escolher um plano (veja a tabela de custos em [08-ferramentas-e-custos.md](08-ferramentas-e-custos.md)).
2. No site: clicar no nome (canto de baixo, à esquerda) → **API Keys** → **Create API Key** → dar um nome → copiar a chave.
3. Na pasta `estudio/`, fazer uma cópia do arquivo `.env.example` e renomear a cópia para `.env.local`.
   - Windows: se o arquivo aparecer como `.env.local.txt`, ativar "Extensões de nomes de arquivos" no Explorador (aba Exibir) e tirar o `.txt`.
4. Abrir o `.env.local` no Bloco de Notas, colar a chave logo depois de `ELEVENLABS_API_KEY=` (sem espaço, sem aspas) e salvar.
5. Pronto. Os scripts leem sozinhos com `node --env-file=.env.local ...`.

Se a chave vazar (foi colada num chat, num print, num arquivo enviado): apagar a chave no site e criar outra.

## Escolher as vozes (barato)

1. Para cada personagem que estreia no bloco, busque candidatas e gere a **página de prévias grátis**:
   `node --env-file=.env.local scripts/buscar_vozes.mjs historias/<h>/vozes-busca/<personagem>.html --idioma pt --genero female --idade young --busca "whisper,soft"`
2. A pessoa ouve as prévias e escolhe. **Escolher pelas prévias e gravar direto funcionou** e economizou as amostras (um bloco inteiro custou 176 créditos, sem amostras).
3. Se ela quiser ouvir a frase da própria série antes: anote 2 ou 3 candidatas em `candidatos` no `vozes.json` e rode `--modo amostras` (custa; avise antes: de 150 a 340 créditos por bloco com 3 candidatas por personagem).
4. Anote a voz escolhida (`voz`, `voice_id`), a `cor` da legenda e o `nome` em `historias/<h>/vozes.json` ([../modelos/vozes.json](../modelos/vozes.json)). Guarde as reservas: se uma voz não agradar depois, troca-se só aquela fala.

Dicas de busca: no espanhol latino, muitas vozes aparecem como "es-AR" sem serem argentinas; o que vale é o campo de sotaque (latin american, mexican, colombian). Personagem que sussurra: busque "whisper", "asmr", "soft".

## Gravar

```
node scripts/voz.mjs <GRAVACAO.md> <pasta-voz> --vozes <vozes.json> --simular
node --env-file=.env.local scripts/voz.mjs <GRAVACAO.md> <pasta-voz> --vozes <vozes.json> --modo falas
```
- Refazer só algumas falas, com tomada nova: `--take 2 --so F03,F06` (as antigas ficam guardadas).
- O script corta o silêncio das pontas, mede cada fala contra a janela da imagem e mostra os créditos reais gastos.
- Anote os créditos no registro do `GRAVACAO.md` e no `ESTADO.md`.

## Montar e medir (grátis)

1. Escreva o `tempos.json` do bloco ([../modelos/tempos.json](../modelos/tempos.json)): início de cada fala no vídeo.
2. `python scripts/montar_vozes.py <tempos.json> <faixa.mp3>`: mostra onde as falas se encostam ou se sobrepõem.
3. Meça o espaço até a próxima fala, não a "janela" do roteiro (que é aproximada).
4. `python scripts/dados_falas.py ...`: tempo de cada palavra (legenda), bocas e conferência das tags.

## Truques que funcionaram

- **Rádio, alto-falante, telefone:** grave a voz **limpa** e faça o efeito na mixagem. Dá para mudar onde o sinal falha sem pagar de novo.
- **Música ou chamada famosa:** a gravação original tem dono. Grave a sua versão com voz nova no mesmo jeito de cantar e aplique o efeito de alto-falante velho na mixagem.
- **Um personagem cantar exatamente como outro:** `trocar_voz.mjs` (speech-to-speech) mantém melodia e ritmo e só troca a voz.
- **Voz nova mais forte que o narrador:** confira o volume de cada trecho (não só o total) e baixe o que passar da narração.

## Custo de referência (medido em séries reais)

Com o modelo `eleven_v4_turbo` e falas com tags, deu cerca de **0,22 crédito por caractere** no plano usado. O custo por caractere muda conforme o plano e o modelo: o script mostra o valor real a cada fala.

| O quê | Caracteres | Créditos (medido) |
|---|---|---|
| Um bloco de ~50 s, 15 falas | ~800 | ~176 |
| Episódio de ~2 min, 35 falas, um idioma | ~1.650 | ~365 |
| O mesmo episódio em espanhol | ~1.750 | ~387 |
| Amostras de 3 candidatas por personagem (opcional) | — | 150 a 340 por bloco |
