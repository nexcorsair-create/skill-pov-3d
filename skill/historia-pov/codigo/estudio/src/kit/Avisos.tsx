// O QUE FICA POR CIMA DA IMAGEM 3D (tudo com desenho próprio: nada de logo, tela oficial ou alerta real):
//   <Palpebras>      piscada: a tela fecha de cima para baixo como uma pálpebra (serve de "corte" e de passagem de tempo)
//   <AlertaRegra>    alerta vermelho que desce do topo, treme enquanto apita e voa para o canto, onde vira a regra fixa
//   <RegrasFixas>    regras acumuladas no canto (só o título de cada uma, pequeno)
//   <Painel>         painel fixo no canto de cima: episódio, hora, lugar
//   <TituloEpisodio> título que aparece por um instante (nome da série + PARTE N)
//   <CartaoVoto>     cartão de duas opções no fim. Entra depois da câmera lenta (~5 s de mundo lento antes dele)
//   <Escuro>         tela preta que clareia (começo de bloco) ou escurece
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { T } from "./idioma";

const F = "'Segoe UI', Arial, sans-serif";
const FB = "'Segoe UI Black', 'Arial Black', Arial, sans-serif";
const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const c01 = (x: number) => Math.min(1, Math.max(0, x));

/** fechado: 0 = aberto, 1 = fechado */
export const Palpebras: React.FC<{ fechado: number }> = ({ fechado }) => {
  if (fechado <= 0.001) return null;
  const W = 1080, H = 1920, meio = H * 0.56;
  const yCima = -120 + (meio + 140) * fechado, yBaixo = H + 120 - (H - meio + 140) * fechado * 0.999, curva = 260 * (1 - fechado * 0.6);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs><filter id="borda" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter></defs>
      <g filter="url(#borda)" fill="#050507">
        <path d={`M0,0 H${W} V${yCima - curva} Q${W / 2},${yCima + curva} 0,${yCima - curva} Z`} />
        <path d={`M0,${H} H${W} V${yBaixo + curva * 0.4} Q${W / 2},${yBaixo - curva * 0.4} 0,${yBaixo + curva * 0.4} Z`} />
      </g>
    </svg>
  );
};
/** piscada pronta: fecha e abre em `dur` segundos a partir de `de` */
export const piscada = (t: number, de: number, dur = 0.35) => { const x = (t - de) / dur; return x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI); };

const Sirene: React.FC<{ s?: number }> = ({ s = 86 }) => (
  <svg width={s} height={s} viewBox="0 0 86 86">
    <circle cx="43" cy="43" r="41" fill="#fff" />
    <path d="M23 60 V40 Q23 20 43 20 Q63 20 63 40 V60 Z" fill="#c8141e" /><rect x="17" y="60" width="52" height="8" fill="#c8141e" /><circle cx="43" cy="40" r="7" fill="#fff" />
  </svg>
);

/** alerta: entra em `de`, treme até `apita`, fica até `sai` e voa para a posição `n` das regras do canto */
export const AlertaRegra: React.FC<{ de: number; apita: number; sai: number; n: number; titulo: string; texto: string; sub?: string }> = ({ de, apita, sai, n, titulo, texto, sub }) => {
  const t = useT();
  if (t < de || t > sai + 0.5) return null;
  const k = interpolate(t, [de, de + 0.25], [0, 1], lim);
  const voa = interpolate(t, [sai, sai + 0.45], [0, 1], { ...lim, easing: (x) => x * x * (3 - 2 * x) });
  const treme = t < apita ? Math.sin(t * 90) * 7 : 0;
  const alvoX = 1080 - 48 - 420, alvoY = 300 + (n - 1) * 70;
  return (
    <div style={{
      position: "absolute", left: interpolate(voa, [0, 1], [40, alvoX]), top: interpolate(voa, [0, 1], [-260 + 300 * k, alvoY]), width: 1000,
      transform: `translateX(${treme}px) scale(${interpolate(voa, [0, 1], [1, 0.42])})`, transformOrigin: "top left", opacity: interpolate(voa, [0.7, 1], [1, 0], lim) * Math.min(1, k * 1.5),
      padding: "24px 30px", borderRadius: 34, background: "linear-gradient(180deg,#c8141e,#a10f17)", boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
      border: "3px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 26, fontFamily: F, color: "#fff",
    }}>
      <Sirene />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 700, opacity: 0.92 }}><span>{titulo}</span><span style={{ fontSize: 26 }}>{T("agora", "ahora", "now")}</span></div>
        <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: 1, lineHeight: 1.05 }}>{texto}</div>
        {sub && <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
};

/** regras acumuladas no canto de cima à direita; cada uma aparece no segundo `de` */
export const RegrasFixas: React.FC<{ regras: { n: number; texto: string; de: number }[]; rotulo?: string }> = ({ regras, rotulo = T("REGRA", "REGLA", "RULE") }) => {
  const t = useT();
  return (
    <>{regras.filter((r) => t >= r.de).map((r) => (
      <div key={r.n} style={{ position: "absolute", right: 48, top: 300 + (r.n - 1) * 70, opacity: interpolate(t, [r.de, r.de + 0.3], [0, 1], lim),
        padding: "10px 18px", borderRadius: 14, background: "rgba(10,12,20,0.72)", border: "2px solid rgba(255,90,78,0.85)", color: "#fff", fontFamily: F, fontWeight: 800, fontSize: 28 }}>
        <span style={{ color: "#ff6b5a" }}>{rotulo} {r.n}</span> · {r.texto}
      </div>
    ))}</>
  );
};

/** painel fixo: episódio / hora (grande) / lugar */
export const Painel: React.FC<{ episodio: string; hora: string; lugar: string; cor?: string }> = ({ episodio, hora, lugar, cor = "#ff6b5a" }) => (
  <div style={{ position: "absolute", left: 54, top: 120, fontFamily: F, color: "#fff", textShadow: "0 3px 0 #1c2340, 0 0 12px rgba(0,0,0,0.6)" }}>
    <div style={{ fontSize: 30, fontWeight: 700, color: cor, letterSpacing: 3 }}>● {episodio}</div>
    <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>{hora}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: "#cfd6ea", letterSpacing: 2 }}>{lugar}</div>
  </div>
);

export const TituloEpisodio: React.FC<{ de: number; ate: number; serie: string; parte: string }> = ({ de, ate, serie, parte }) => {
  const t = useT(); if (t < de || t > ate) return null;
  const a = Math.min(interpolate(t, [de, de + 0.2], [0, 1], lim), interpolate(t, [ate - 0.25, ate], [1, 0], lim));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: a, fontFamily: FB, color: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 110, lineHeight: 1, WebkitTextStroke: "8px #0b0d14", paintOrder: "stroke fill", transform: `scale(${interpolate(t, [de, ate], [1, 1.06])})` }}>{serie}</div>
      <div style={{ fontSize: 52, marginTop: 14, color: "#ffd84a", WebkitTextStroke: "6px #0b0d14", paintOrder: "stroke fill" }}>{parte}</div>
    </AbsoluteFill>
  );
};

/** cartão de voto. Cada opção: até 6 palavras, começa com verbo, e as duas custam alguma coisa.
 *  `palavra` = a palavra única que o público comenta (que sirva em todos os países do idioma). */
export type Opcao = { cor: string; icone: string; linha1: string; linha2?: string; palavra: string; corPalavra?: string };
export const CartaoVoto: React.FC<{ de: number; pergunta: string; a: Opcao; b: Opcao; ou?: string; comente?: string }> = ({ de, pergunta, a, b, ou = T("OU", "O", "OR"), comente = T("COMENTE:", "COMENTA:", "COMMENT:") }) => {
  const t = useT(); const k = c01((t - de) / 0.45); if (k <= 0) return null;
  const pop = (x0: number) => { const x = c01((t - x0) / 0.35); return 0.85 + 0.15 * Math.sin(x * Math.PI * 0.75) / Math.sin(Math.PI * 0.75); };
  const txt: React.CSSProperties = { fontFamily: FB, fontWeight: 900, color: "#fff", textAlign: "center", WebkitTextStroke: "3px #111", paintOrder: "stroke fill", lineHeight: 1.08 };
  const caixa = (o: Opcao, x0: number) => (
    <div style={{ opacity: c01((t - x0) / 0.25), transform: `scale(${pop(x0)})`, background: o.cor, borderRadius: 34, padding: "34px 30px", margin: "0 60px", border: "6px solid rgba(255,255,255,0.9)", boxShadow: "0 18px 40px rgba(0,0,0,0.55)", display: "flex", alignItems: "center", gap: 26 }}>
      <div style={{ fontSize: 96, lineHeight: 1 }}>{o.icone}</div>
      <div style={{ ...txt, fontSize: 60, textAlign: "left" }}>{o.linha1}{o.linha2 && <><br /><span style={{ fontSize: 44 }}>{o.linha2}</span></>}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: `rgba(5,7,12,${0.62 * k})`, justifyContent: "center", gap: 40 }}>
      <div style={{ ...txt, fontSize: 54, opacity: k, color: "#ffd84a", marginBottom: 10 }}>{pergunta}</div>
      {caixa(a, de + 0.25)}
      <div style={{ ...txt, fontSize: 50, opacity: c01((t - de - 0.45) / 0.2) }}>{ou}</div>
      {caixa(b, de + 0.6)}
      <div style={{ ...txt, fontSize: 46, marginTop: 30, opacity: c01((t - de - 1.0) / 0.3) }}>{comente} <span style={{ color: a.corPalavra ?? "#7fb2ff" }}>{a.palavra}</span> {ou} <span style={{ color: b.corPalavra ?? "#ff6b6b" }}>{b.palavra}</span></div>
    </AbsoluteFill>
  );
};

/** preto que clareia (de 1 a 0 entre a e b) ou escurece (inverta a e b) */
export const Escuro: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const t = useT(); const k = a < b ? interpolate(t, [a, b], [1, 0], lim) : interpolate(t, [b, a], [0, 1], lim);
  return k > 0.001 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${k})` }} /> : null;
};
