# 7. Legendas, montagem e publicação

## Legendas (todo vídeo tem)

Muita gente assiste sem som. Os três estilos do kit leem o mesmo `falas.json` (gerado por `dados_falas.py`). A pessoa escolhe na entrevista:

| Estilo | Componente | Quando usar |
|---|---|---|
| Uma palavra por vez, branca em negrito com contorno escuro | `<LegendaPalavra>` | Padrão; narração; vídeo com uma voz só |
| Nome + medidor de voz + tom, frase palavra por palavra (a falada agora na cor do personagem) | `<LegendaFalada>` | POV com várias vozes: sem rosto na tela, a cor e o nome dizem quem fala |
| Frase inteira, um pouco menor (~62 px), na cor do personagem | `<LegendaFrase>` | Falas curtas, conversa rápida |

Regras:
- **Nunca em cima** do celular, de um rosto, de um aviso ou do cartão de voto (esconda a legenda quando o cartão entra).
- Posição fixa durante a fala (não pular). Use `pos: "topo"` quando a parte de baixo da tela tem algo importante.
- Palavras de perigo podem ficar sempre na cor (`destaque`).
- Interjeições ("AIII!") e textos escritos direto no código também precisam ser traduzidos no outro idioma.
- No Windows, Arial em negrito extra vira Arial Black: o kit usa Segoe UI Black e cai para Arial nos outros sistemas.

## Montagem do episódio

1. Cada bloco aprovado, com som, renderizado.
2. Junte os blocos: `python scripts/juntar_blocos.py out/ep01-sem-gancho.mp4 bloco1.mp4 bloco2.mp4 bloco3.mp4`.
   **Gancho na frente** (sem novo render): os 3 a 5 s mais fortes + o cartão "MINUTOS ANTES..." (0,6 s, composição `CartaoTexto`) + o episódio:
   crie `out/cartao.json` com `{"texto": "MINUTOS ANTES..."}` e rode `npx remotion render src/index.ts CartaoTexto out/minutos-antes.mp4 --props=out/cartao.json`
   `python scripts/juntar_blocos.py out/ep01.mp4 --gancho out/ep01-sem-gancho.mp4 98.5 3.4 out/minutos-antes.mp4 out/ep01-sem-gancho.mp4`
3. O script corta o som de cada bloco no tamanho exato da imagem (cada render sai com ~0,05 s a mais de som e, sem cortar, a voz atrasa a cada emenda).
4. Meça: `earshot measure final/ep01.mp4` (alvo -14 LUFS, pico abaixo de -1 dB) e `python scripts/qa.py final/ep01.mp4 final/qa` (quadros pretos, congelados, pulos).
5. Olhe as folhas de quadros do `qa.py` e diga à pessoa o que não deu para verificar (movimento, sincronia fina de boca, sensação do som).

Entregue três arquivos: o **mestre** (qualidade máxima), o **para postar** (h264, `-crf 18`, `+faststart`) e uma **prévia leve** para o celular (`-crf 28`, 720x1280).

## Camadas separadas (para quem edita depois)

Selo, contador ou hora que muda com a história podem sair **fora do vídeo**, numa camada transparente à parte (ProRes 4444 `.mov` + PNG), para a pessoa ajustar no editor dela sem refazer o 3D. Pergunte se ela edita em outro programa.

## Título, descrição e capa

Use [../modelos/TITULO-E-DESCRICAO.md](../modelos/TITULO-E-DESCRICAO.md): 4 títulos e 3 descrições para a pessoa escolher, em cada idioma. Capa 1080x1920 a partir de um quadro limpo do momento mais forte, com o título e "PARTE N" (faça uma composição só para a capa e renderize um quadro).

**Quem publica é a pessoa.** Não poste, não agende, não envie a nenhum site.
