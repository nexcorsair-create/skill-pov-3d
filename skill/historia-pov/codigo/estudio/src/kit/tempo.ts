// TEMPO E CÂMERA: funções pequenas usadas em toda cena.
//
// Regra de ouro do render: os quadros saem FORA DE ORDEM e ao mesmo tempo (vários processos).
// Nada pode depender do quadro anterior: calcule tudo a partir do tempo `t` (segundos).
import * as THREE from "three";

export const c01 = (x: number) => Math.min(1, Math.max(0, x));
/** curva suave de 0 a 1 */
export const suave = (x: number) => { const k = c01(x); return k * k * (3 - 2 * k); };
/** 0 antes de a, 1 depois de b, suave entre os dois */
export const entre = (t: number, a: number, b: number) => suave((t - a) / (b - a));

/** CÂMERA EM PRIMEIRA PESSOA por pontos-chave: em cada tempo, onde a cabeça está (p) e para onde olha (o).
 *  Entre dois pontos, mistura suave. Para andar em velocidade constante, NÃO freie em cada ponto: use `linear: true`
 *  nos pontos do meio do caminho (frear em cada ponto deixa o andar aos trancos). */
export type Chave = { t: number; p: THREE.Vector3; o: THREE.Vector3; linear?: boolean };
export function camera(chaves: Chave[], t: number) {
  if (t <= chaves[0].t) return { p: chaves[0].p.clone(), o: chaves[0].o.clone() };
  for (let i = 0; i < chaves.length - 1; i++) {
    const a = chaves[i], b = chaves[i + 1];
    if (t <= b.t) {
      const x = (t - a.t) / (b.t - a.t), k = b.linear ? x : suave(x);
      return { p: a.p.clone().lerp(b.p, k), o: a.o.clone().lerp(b.o, k) };
    }
  }
  const z = chaves[chaves.length - 1]; return { p: z.p.clone(), o: z.o.clone() };
}

/** respiração e passos: balanço pequeno da cabeça. andando = 0 (parado) a 1 (andando) */
export const balanco = (t: number, andando = 0) => ({
  x: Math.sin(t * 1.3) * 0.004 + Math.sin(t * 4.4) * 0.012 * andando,
  y: Math.sin(t * 0.9) * 0.006 + Math.abs(Math.sin(t * 4.4)) * 0.025 * andando,
});

/** CÂMERA LENTA ANTES DA DECISÃO: o MUNDO (personagens, carros, luzes) desacelera; o olhar e as vozes não.
 *  Devolve uma função tempoMundo(t). Use o tempo do mundo para animar tudo o que está na cena, e o tempo normal
 *  para a câmera, a legenda e a voz. Ex.: const tm = tempoMundo({ ini: 20, fim: 21, ritmo: 0.18 }); pessoa.anda(tm(t)) */
export function tempoMundo(lento: { ini: number; fim: number; ritmo: number }, fps = 60, duracaoMax = 600) {
  const passos = Math.ceil(duracaoMax * fps), acum = new Float64Array(passos + 1);
  let w = 0;
  for (let i = 1; i <= passos; i++) {
    const t = (i - 0.5) / fps;
    w += (1 - (1 - lento.ritmo) * suave((t - lento.ini) / (lento.fim - lento.ini))) / fps;
    acum[i] = w;
  }
  return (t: number) => {
    if (t <= 0) return t;
    const x = t * fps, i = Math.min(Math.floor(x), passos - 1), k = x - i;
    return acum[i] + (acum[i + 1] - acum[i]) * k;
  };
}
