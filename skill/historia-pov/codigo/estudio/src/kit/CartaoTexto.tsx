// CARTÃO DE TEXTO em tela preta (ex.: "MINUTOS ANTES...", "PARTE 2", "3 HORAS DEPOIS"), com um silêncio de som.
// Renderize com um arquivo de props (funciona igual no Windows e no Mac):
//   out/cartao.json = {"texto": "MINUTOS ANTES..."}
//   npx remotion render src/index.ts CartaoTexto out/minutos-antes.mp4 --props=out/cartao.json
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const CartaoTexto: React.FC<{ texto: string }> = ({ texto }) => {
  const f = useCurrentFrame(), { durationInFrames } = useVideoConfig();
  const a = Math.min(interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [durationInFrames - 4, durationInFrames], [1, 0], { extrapolateLeft: "clamp" }));
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: a, color: "#fff", fontFamily: "'Segoe UI Black', 'Arial Black', Arial, sans-serif", fontSize: 76, letterSpacing: 4, textAlign: "center", padding: 60 }}>{texto}</div>
    </AbsoluteFill>
  );
};
