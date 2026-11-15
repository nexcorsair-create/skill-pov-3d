// Lista de vídeos (composições) do estúdio. Cada história acrescenta as suas composições aqui, sem mexer nas outras.
import React from "react";
import { Composition } from "remotion";
import { Exemplo, EXEMPLO_DURACAO } from "./exemplo/Exemplo";
import { CartaoTexto } from "./kit/CartaoTexto";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Exemplo" component={Exemplo} durationInFrames={EXEMPLO_DURACAO * FPS} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "pt" as const }} />
    <Composition id="ExemploES" component={Exemplo} durationInFrames={EXEMPLO_DURACAO * FPS} fps={FPS} width={1080} height={1920} defaultProps={{ idioma: "es" as const }} />
    <Composition id="CartaoTexto" component={CartaoTexto} durationInFrames={18} fps={FPS} width={1080} height={1920} defaultProps={{ texto: "MINUTOS ANTES..." }} />
    {/* acrescente aqui as composições da sua história, por exemplo:
    <Composition id="MinhaSerieEp01B1" component={Ep01Bloco1} durationInFrames={Math.round(30.5 * FPS)} fps={FPS} width={1080} height={1920} /> */}
  </>
);
