// LEGENDAS. Todo vídeo tem legenda: muita gente assiste sem som. Três jeitos, todos lendo o mesmo `falas.json`
// (gerado por scripts/dados_falas.py a partir dos tempos medidos pelo faster-whisper):
//
//  1. <LegendaPalavra>  uma palavra por vez, branca em negrito com contorno escuro (padrão; a mais simples).
//  2. <LegendaFalada>   nome de quem fala + medidor de voz + tom entre parênteses; a frase vai aparecendo palavra
//                       por palavra, a palavra falada AGORA na cor do personagem, as já faladas em branco.
//                       Ótima para POV: sem rosto na tela, a cor e o nome dizem quem fala.
//  3. <LegendaFrase>    a frase inteira de uma vez, um pouco menor, na cor do personagem (falas curtas).
//
// Regras: nunca em cima do celular, do rosto de alguém ou de um aviso; posição fixa durante a fala (não pular);
// palavras de perigo podem ficar sempre na cor (`destaque`).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Fala = {
  quem: string; cor: string; tom?: string;
  palavras: [number, string][]; // [segundo em que a palavra começa, palavra]
  fim: number;                   // segundo em que a fala sai da tela
  destaque?: string[];           // palavras que ficam SEMPRE na cor
  pos?: "topo" | "baixo";
};

// No Windows, Arial 800/900 vira Arial Black: use Segoe UI Black (Windows) e caia para Arial (Mac/Linux).
export const FONTE = "'Segoe UI Black', 'Segoe UI', 'Arial Black', Arial, sans-serif";
export const CONTORNO = "0 4px 0 rgba(8,10,20,0.85), 0 0 3px rgba(8,10,20,0.9), 0 0 18px rgba(0,0,0,0.55)";
const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const Y = (pos?: "topo" | "baixo") => ((pos ?? "baixo") === "topo" ? 300 : 1300);

/** 1. uma palavra por vez */
export const LegendaPalavra: React.FC<{ falas: Fala[]; tamanho?: number }> = ({ falas, tamanho = 92 }) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const f = falas.find((x) => t >= x.palavras[0][0] - 0.02 && t < x.fim);
  if (!f) return null;
  let i = -1; f.palavras.forEach(([s], k) => { if (t >= s) i = k; });
  if (i < 0) return null;
  const [s, w] = f.palavras[i];
  const pop = interpolate(t, [s, s + 0.08], [0.86, 1], lim);
  const fixo = f.destaque?.some((d) => w.toUpperCase().includes(d.toUpperCase()));
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: Y(f.pos), fontFamily: FONTE, fontWeight: 900, fontSize: tamanho, color: fixo ? f.cor : "#fff",
        WebkitTextStroke: "10px #0b0d14", paintOrder: "stroke fill", textShadow: CONTORNO, transform: `scale(${pop})`, textTransform: "uppercase" }}>{w}</div>
    </AbsoluteFill>
  );
};

const Medidor: React.FC<{ nivel: number[] | null; cor: string }> = ({ nivel, cor }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 4, height: 30 }}>
    {Array.from({ length: 7 }, (_, i) => {
      const v = nivel ? Math.max(0.12, nivel[i] ?? 0) : 0;
      return <div key={i} style={{ width: 5, height: nivel ? 6 + v * 24 : 5, borderRadius: 3, background: cor, opacity: nivel ? 0.55 + v * 0.45 : 0.45 }} />;
    })}
  </div>
);

/** 2. nome + medidor + tom, frase palavra por palavra. `medidor`: 7 valores (0 a 1) por quadro, opcional */
export const LegendaFalada: React.FC<{ falas: Fala[]; medidor?: number[][] }> = ({ falas, medidor }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const f = falas.find((x) => t >= x.palavras[0][0] - 0.05 && t < x.fim);
  if (!f) return null;
  const ini = f.palavras[0][0];
  const alfa = Math.min(interpolate(t, [ini - 0.05, ini + 0.08], [0, 1], lim), interpolate(t, [f.fim - 0.18, f.fim], [1, 0], lim));
  let atual = -1; f.palavras.forEach(([s], i) => { if (t >= s) atual = i; });
  const falando = atual >= 0 && (atual < f.palavras.length - 1 || t < f.palavras[f.palavras.length - 1][0] + 0.45);
  const nivel = falando ? (medidor ? medidor[Math.min(frame, medidor.length - 1)] : [0.5, 0.8, 0.6, 1, 0.7, 0.5, 0.8].map((v, i) => v * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i))))) : null;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: Y(f.pos), width: 900, display: "flex", flexDirection: "column", alignItems: "center", opacity: alfa, fontFamily: FONTE }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, textShadow: CONTORNO }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: f.cor }}>{f.quem}</span>
          <Medidor nivel={nivel} cor={f.cor} />
          {f.tom && <span style={{ fontSize: 28, fontWeight: 600, fontStyle: "italic", color: "rgba(225,228,236,0.72)", fontFamily: "'Segoe UI', Arial, sans-serif" }}>({f.tom})</span>}
        </div>
        <div style={{ maxWidth: 820, textAlign: "center", lineHeight: 1.12, fontSize: 70, fontWeight: 900, color: "#fff", textShadow: CONTORNO }}>
          {f.palavras.map(([s, w], i) => {
            if (t < s) return null;
            const k = interpolate(t, [s, s + 0.12], [0, 1], { extrapolateRight: "clamp" });
            const naCor = f.destaque?.some((d) => w.toUpperCase().includes(d.toUpperCase())) || (i === atual && falando);
            return <span key={i} style={{ display: "inline-block", marginRight: "0.26em", color: naCor ? f.cor : "#fff", opacity: k, filter: `blur(${(1 - k) * 6}px)`, transform: `translateY(${(1 - k) * 10}px)`, textShadow: naCor ? `${CONTORNO}, 0 0 22px ${f.cor}88` : CONTORNO }}>{w}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 3. frase inteira na cor do personagem */
export const LegendaFrase: React.FC<{ falas: Fala[]; tamanho?: number }> = ({ falas, tamanho = 62 }) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const f = falas.find((x) => t >= x.palavras[0][0] - 0.05 && t < x.fim);
  if (!f) return null;
  const a = Math.min(interpolate(t, [f.palavras[0][0] - 0.05, f.palavras[0][0] + 0.06], [0, 1], lim), interpolate(t, [f.fim - 0.12, f.fim], [1, 0], lim));
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: Y(f.pos), maxWidth: 900, textAlign: "center", fontFamily: FONTE, fontWeight: 900, fontSize: tamanho, lineHeight: 1.15, color: f.cor,
        WebkitTextStroke: "8px #0b0d14", paintOrder: "stroke fill", opacity: a }}>{f.palavras.map((p) => p[1]).join(" ")}</div>
    </AbsoluteFill>
  );
};
