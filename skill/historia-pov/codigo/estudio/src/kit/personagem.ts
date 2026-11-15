// PERSONAGEM 3D no "estilo desenho" (2D em mundo 3D): sombra em 2 tons, rosto desenhado numa textura,
// contorno grosso feito pelo InkPass (ink.ts). Monte personagens por peças com um `Look` e mexa com `pose()`.
// Regras de acabamento:
//   - sombra em 2 tons com passagem curta (MeshToonMaterial + rampa); o rosto tem sombra bem mais leve (fica limpo);
//   - peças simples: cabeça grande, ombros redondos, braços em tubo, mãos-luva com polegar, cabelo num volume só;
//   - rosto desenhado: olhos amendoados grandes, íris escura com dois brilhos, pálpebra grossa, sobrancelha que muda
//     o humor. Expressões: neutro, susto, transe (olhos vazios), triste, falando.
// Peças do Look: corpo, pele, cabelo, roupa de cima, roupa de baixo, calçado e acessórios.
// Sistema local: olha para +Z, esquerda dele = +X, pés no y = 0.
// Lição: personagem plano parece colado no ar. Apoie sempre em algo 3D (chão, cadeira, batente) e confira os pés.
import * as THREE from "three";
import { NOINK } from "./ink";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const escurecer = (hex: string, k: number) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return `#${c.getHexString()}`; };

// rampa de luz: sombra a ~37 % da luz, passagem curta (1/8 da rampa)
const rampaDe = (px: number[]) => { const t = new THREE.DataTexture(new Uint8Array(px.flatMap((v) => [v, v, v, 255])), px.length, 1, THREE.RGBAFormat); t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
let rampa: THREE.DataTexture | null = null, rampaR: THREE.DataTexture | null = null;
const mats = new Map<string, THREE.Material>();
export const toon = (c: string) => {
  if (!mats.has(c)) { rampa ??= rampaDe([95, 95, 95, 95, 255, 255, 255, 255]); mats.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: rampa })); }
  return mats.get(c)!;
};
/** rosto quase sempre iluminado (como na referência): sombra da cabeça a ~82 % da luz, só para dar volume */
const toonRosto = (c: string) => {
  const k = "rosto" + c; if (mats.has(k)) return mats.get(k)!;
  rampaR ??= rampaDe([210, 210, 210, 230, 255, 255, 255, 255]);
  const m = new THREE.MeshToonMaterial({ color: c, gradientMap: rampaR }); mats.set(k, m); return m;
};
/** material com textura (estampa, letreiro) mas com a mesma sombra em 2 tons */
export const toonMapa = (t: THREE.Texture) => { rampa ??= rampaDe([95, 95, 95, 95, 255, 255, 255, 255]); return new THREE.MeshToonMaterial({ map: t, gradientMap: rampa }); };

const esf = (r: number, cor: string, s = V(1, 1, 1)) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), toon(cor)); m.scale.copy(s); return m; };
/** tubo pendurado para baixo a partir da articulação, pontas redondas */
const tubo = (r: number, len: number, cor: string, r2 = r) => {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, len, 28), toon(cor)); m.position.y = -len / 2; g.add(m);
  const b = new THREE.Mesh(new THREE.SphereGeometry(r2, 28, 16), toon(cor)); b.position.y = -len; g.add(b);
  return g;
};
const casca = (geo: THREE.BufferGeometry, cor: string) => { const m = new THREE.Mesh(geo, toon(cor)); (m.material as THREE.Material).side = THREE.DoubleSide; return m; };

export type Expressao = "neutro" | "susto" | "transe" | "triste" | "falando";
export type Look = {
  pele: string; cabelo: string; roupa: string; roupa2?: string; avental?: string; calcado: string;
  olhos?: string; labios?: string;
  corpo?: "adulta" | "adulto" | "idoso" | "jovem" | "crianca";
  /** cabelo: coque , curto, bobes, careca (com coroa dos lados), cacheado, rabo */
  penteado?: "coque" | "curto" | "bobes" | "careca" | "cacheado" | "rabo";
  /** roupa de cima: manga curta (padrão), regata (braço todo de pele), moletom (manga comprida) */
  cima?: "manga" | "regata" | "moletom";
  vestido?: boolean; // camisola / vestido / roupão comprido em vez de calça
  faixa?: string; // faixa do roupão na cintura
  calca?: string; // cor da calça (sem vestido)
  tenis?: boolean; // tênis em vez de chinelo
  presilha?: string; bobes?: string; bone?: string; bigode?: string; oculos?: boolean; relogio?: string; pulseira?: string;
  rugas?: boolean; barriga?: boolean; masc?: boolean;
  luvas?: string; // mãos com luva desta cor
};

export type Pose = Partial<{
  tronco: [number, number, number]; cabeca: [number, number, number];
  ombroE: [number, number, number]; ombroD: [number, number, number]; cotoveloE: number; cotoveloD: number;
  coxaE: [number, number, number]; coxaD: [number, number, number]; joelhoE: number; joelhoD: number;
}>;
const R = THREE.MathUtils.degToRad;

/** medidas de cada tipo de corpo (a "adulta" é a medida de referência) */
const CORPOS = {
  adulta: { ph: 0.8, ombro: 0.2, peito: V(0.95, 1.35, 0.78), cab: 0.165, coxa: 0.36, canela: 0.33, perna: 0.075, curva: 0 },
  adulto: { ph: 0.86, ombro: 0.235, peito: V(1.12, 1.38, 0.86), cab: 0.165, coxa: 0.39, canela: 0.35, perna: 0.082, curva: 0 },
  idoso: { ph: 0.74, ombro: 0.215, peito: V(1.06, 1.3, 0.86), cab: 0.16, coxa: 0.34, canela: 0.3, perna: 0.075, curva: 12 },
  jovem: { ph: 0.82, ombro: 0.2, peito: V(0.95, 1.3, 0.76), cab: 0.168, coxa: 0.38, canela: 0.34, perna: 0.07, curva: 0 },
  crianca: { ph: 0.52, ombro: 0.165, peito: V(0.8, 1.0, 0.68), cab: 0.16, coxa: 0.24, canela: 0.22, perna: 0.06, curva: 0 },
};

/** mão-luva: palma redonda e polegar */
const luva = (pele: string, lado: number) => {
  const g = new THREE.Group();
  const p = esf(0.056, pele, V(0.95, 1.2, 0.72)); p.position.y = -0.05; g.add(p);
  const pol = tubo(0.02, 0.04, pele); pol.position.set(0.042 * lado, -0.028, 0.02); pol.rotation.z = -0.8 * lado; g.add(pol);
  return g;
};

/** rosto desenhado (canvas 512 com escala 2x) */
function desenharRosto(g: CanvasRenderingContext2D, l: Look, e: Expressao) {
  const INK = "#1c2340", masc = !!l.masc;
  const sobr = l.rugas && l.cabelo === "#d9d6d0" ? "#bdb8ae" : l.cabelo;
  g.clearRect(0, 0, 512, 512); g.lineCap = "round"; g.lineJoin = "round";
  g.save(); g.translate(256, 268); g.scale(1.5, 1.5); g.translate(-256, -250); // traços grandes: o rosto lê de longe
  g.fillStyle = masc ? "rgba(200,90,80,0.12)" : "rgba(220,95,95,0.20)"; for (const x of [150, 362]) { g.beginPath(); g.ellipse(x, 290, 44, 24, 0, 0, 7); g.fill(); } // bochechas
  if (l.rugas) { g.strokeStyle = "rgba(90,45,30,0.45)"; g.lineWidth = 4; for (const y of [120, 132]) { g.beginPath(); g.moveTo(200, y); g.quadraticCurveTo(256, y - 8, 312, y); g.stroke(); } for (const x of [150, 362]) { g.beginPath(); g.moveTo(x - 6, 250); g.lineTo(x + 6, 262); g.stroke(); } }
  for (const [x, s] of [[196, -1], [316, 1]] as const) {
    const y = 222, fora = s;
    const ry = (e === "susto" ? 46 : e === "transe" ? 30 : e === "triste" ? 34 : 40) * (masc ? 0.9 : 1), rx = masc ? 37 : 40;
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.clip();
    g.fillStyle = "#fffaf2"; g.fillRect(x - 50, y - 60, 100, 120);
    if (e !== "transe") {
      const ri = e === "susto" ? 17 : 25, ix = x + 3 * s, iy = y + (e === "triste" ? 8 : 4);
      g.fillStyle = l.olhos ?? "#3a2216"; g.beginPath(); g.arc(ix, iy, ri, 0, 7); g.fill();
      g.fillStyle = "#0e0a0a"; g.beginPath(); g.arc(ix, iy, ri * 0.5, 0, 7); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(ix + 9 * s, iy - 10, ri * 0.34, 0, 7); g.fill(); g.beginPath(); g.arc(ix - 7 * s, iy + 9, ri * 0.15, 0, 7); g.fill();
    } else { g.fillStyle = "rgba(150,160,190,0.35)"; g.beginPath(); g.arc(x, y + 4, 22, 0, 7); g.fill(); } // transe: olho vazio
    if (e === "transe" || e === "triste") { g.fillStyle = escurecer(l.pele, 0.9); g.fillRect(x - 50, y - 60, 100, 60 - ry * (e === "transe" ? 0.25 : 0.55)); } // pálpebra caída
    g.restore();
    g.strokeStyle = INK; g.lineWidth = masc ? 9 : 11; g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
    if (!masc) { g.lineWidth = 9; g.beginPath(); g.moveTo(x + rx * 0.96 * fora, y - 6); g.lineTo(x + (rx + 12) * fora, y - 16); g.stroke(); } // ponta da pálpebra (cílio)
    g.lineWidth = 4; g.strokeStyle = "rgba(28,35,64,0.6)"; g.beginPath(); g.ellipse(x, y, rx * 0.92, ry, 0, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
    if (l.oculos) { g.strokeStyle = "#2a2622"; g.lineWidth = 8; g.beginPath(); g.ellipse(x, y + 2, 52, 46, 0, 0, 7); g.stroke(); if (s < 0) { g.beginPath(); g.moveTo(x + 52, y - 4); g.lineTo(316 - 52, y - 4); g.stroke(); } }
    // sobrancelha: forma preenchida que muda com o humor (mais grossa nos homens)
    const dentro = x - 34 * fora, ponta = x + 42 * fora, esp = masc ? 22 : 16;
    const yIn = e === "susto" ? 138 : e === "triste" ? 150 : e === "transe" ? 162 : 158;
    const yOut = e === "susto" ? 150 : e === "triste" ? 172 : e === "transe" ? 166 : 160;
    g.fillStyle = sobr; g.beginPath();
    g.moveTo(dentro, yIn + 6); g.quadraticCurveTo(x, Math.min(yIn, yOut) - 20, ponta, yOut); g.quadraticCurveTo(x, Math.min(yIn, yOut) - 20 + esp, dentro, yIn + 6 + esp); g.closePath(); g.fill();
  }
  g.strokeStyle = "rgba(110,55,35,0.7)"; g.lineWidth = 6; g.beginPath(); g.moveTo(248, 290); g.quadraticCurveTo(258, 304, 270, 292); g.stroke(); // nariz
  if (l.bigode) { g.fillStyle = l.bigode; g.beginPath(); g.moveTo(206, 330); g.quadraticCurveTo(256, 300, 306, 330); g.quadraticCurveTo(290, 344, 256, 334); g.quadraticCurveTo(222, 344, 206, 330); g.fill(); }
  const by = 352, lab = l.labios ?? (masc ? "#6e3a30" : "#8a4038");
  if (e === "susto" || e === "falando") {
    const w = e === "susto" ? 24 : 32, h = e === "susto" ? 30 : 20;
    g.fillStyle = "#3a1414"; g.beginPath(); g.ellipse(256, by, w, h, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(256, by, w, h, 0, 0, 7); g.clip(); g.fillStyle = "#d0605e"; g.beginPath(); g.ellipse(256, by + h * 0.75, w * 0.7, h * 0.5, 0, 0, 7); g.fill(); g.restore();
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(256, by, w, h, 0, 0, 7); g.stroke();
  } else {
    g.strokeStyle = lab; g.lineWidth = masc ? 8 : 10;
    g.beginPath();
    if (e === "triste") { g.moveTo(226, by + 8); g.quadraticCurveTo(256, by - 8, 286, by + 8); }
    else if (e === "transe") { g.moveTo(232, by); g.lineTo(280, by); }
    else { g.moveTo(222, by - 2); g.quadraticCurveTo(256, by + 14, 290, by - 2); }
    g.stroke();
  }
  g.restore();
}

export class Personagem {
  root = new THREE.Group();
  quadril = new THREE.Group(); tronco = new THREE.Group(); cabeca = new THREE.Group();
  ombroE = new THREE.Group(); ombroD = new THREE.Group(); cotoveloE = new THREE.Group(); cotoveloD = new THREE.Group();
  maoE = new THREE.Group(); maoD = new THREE.Group();
  coxaE = new THREE.Group(); coxaD = new THREE.Group(); joelhoE = new THREE.Group(); joelhoD = new THREE.Group();
  private ctx: CanvasRenderingContext2D; private tex: THREE.CanvasTexture; private chave = "";
  private curva = 0;
  constructor(public l: Look) {
    const C = CORPOS[l.corpo ?? "adulta"]; this.curva = C.curva;
    const baixo = l.vestido ? l.pele : l.calca ?? l.roupa2 ?? l.roupa;
    this.root.add(this.quadril); this.quadril.position.y = C.ph;
    // pernas em tubo (calça comprida cobre a canela; com vestido só aparece a canela)
    for (const [coxa, joelho, s] of [[this.coxaE, this.joelhoE, 1], [this.coxaD, this.joelhoD, -1]] as const) {
      coxa.position.set(0.085 * s * (C.ombro / 0.2), 0, 0); this.quadril.add(coxa);
      coxa.add(tubo(C.perna, C.coxa, baixo, C.perna * 0.83)); joelho.position.y = -C.coxa - 0.02; coxa.add(joelho);
      joelho.add(tubo(C.perna * 0.88, C.canela, l.vestido ? l.pele : baixo, C.perna * 0.76));
      const pe = new THREE.Group(); pe.position.y = -C.canela - 0.04; joelho.add(pe);
      if (l.tenis) {
        const t = esf(0.074, l.calcado, V(0.95, 0.62, 1.55)); t.position.set(0, -0.015, 0.05); pe.add(t);
        const sola = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.24), toon("#f2efe8")); sola.position.set(0, -0.045, 0.05); pe.add(sola);
      } else {
        const chinelo = esf(0.072, l.calcado, V(0.95, 0.42, 1.55)); chinelo.position.set(0, -0.03, 0.05); pe.add(chinelo);
        const tira = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI), toon(l.roupa2 ?? l.calcado)); tira.position.set(0, -0.02, 0.07); tira.rotation.set(0, Math.PI / 2, 0); pe.add(tira);
      }
    }
    // tronco: uma forma só; quadril da calça; com vestido, a saia é um cone até a canela
    this.quadril.add(this.tronco);
    const peitoS = C.peito.clone(); if (l.barriga) peitoS.z *= 1.18;
    const corpo = esf(0.2, l.roupa, peitoS); corpo.position.y = 0.26; this.tronco.add(corpo);
    if (!l.vestido) { const q = esf(0.19, baixo, V(C.peito.x * 1.02, 0.6, C.peito.z * (l.barriga ? 1.1 : 1))); q.position.y = 0.02; this.quadril.add(q); }
    if (l.vestido) {
      const k = C.peito.x / 0.95, alt = C.coxa + 0.26;
      const saia = casca(new THREE.CylinderGeometry(0.17 * k, 0.27 * k, alt, 36, 1, true), l.roupa); saia.position.y = 0.11 - alt / 2; this.tronco.add(saia);
      const barra = new THREE.Mesh(new THREE.TorusGeometry(0.27 * k, 0.014, 8, 40), toon(l.roupa2 ?? l.roupa)); barra.rotation.x = Math.PI / 2; barra.position.y = 0.11 - alt; this.tronco.add(barra);
    }
    if (l.faixa) { // roupão: faixa na cintura com o nó na frente e gola em V
      const f = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 40), toon(l.faixa)); f.rotation.x = Math.PI / 2; f.position.y = 0.12; f.scale.set(C.peito.x / 0.95, 0.84, 1); this.tronco.add(f);
      const no = esf(0.03, l.faixa, V(1.3, 1, 0.8)); no.position.set(0.05, 0.11, 0.17); this.tronco.add(no);
      for (const s of [-1, 1]) { const p = tubo(0.016, 0.16, l.faixa); p.position.set(0.05 + 0.02 * s, 0.1, 0.17); p.rotation.z = 0.1 * s; this.tronco.add(p); }
      for (const s of [-1, 1]) { const gola = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.02), toon(l.roupa2 ?? l.roupa)); gola.position.set(0.05 * s, 0.33, 0.15); gola.rotation.set(-0.25, 0, 0.42 * s); this.tronco.add(gola); }
    }
    if (l.avental) { // avental por cima da roupa
      const borda = escurecer(l.avental, 0.82);
      const av = casca(new THREE.CylinderGeometry(0.19, 0.262, 0.5, 32, 1, true, -0.78, 1.56), l.avental); av.position.set(0, -0.12, 0.01); this.tronco.add(av);
      const barraAv = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.011, 6, 30, 1.56), toon(borda)); barraAv.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 0.78); barraAv.position.set(0, -0.37, 0.01); this.tronco.add(barraAv);
      const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.188, 0.018, 8, 40), toon(l.avental)); faixa.rotation.x = Math.PI / 2; faixa.position.y = 0.14; faixa.scale.set(1, 0.84, 1); this.tronco.add(faixa);
      for (const s of [-1, 1]) { const laco = esf(0.035, l.avental, V(1.4, 0.8, 0.6)); laco.position.set(0.035 * s, 0.14, -0.165); laco.rotation.z = 0.5 * s; this.tronco.add(laco); }
      const peito = casca(new THREE.CylinderGeometry(0.15, 0.175, 0.24, 24, 1, true, -0.62, 1.24), l.avental); peito.position.set(0, 0.27, 0.0); this.tronco.add(peito);
      for (const s of [-1, 1]) { const al = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.013, 6, 20, Math.PI * 0.9), toon(l.avental)); al.position.set(0.075 * s, 0.39, -0.01); al.rotation.set(0, Math.PI / 2, 0); this.tronco.add(al); }
      const bolso = casca(new THREE.CylinderGeometry(0.237, 0.243, 0.1, 24, 1, true, -0.32, 0.64), borda); bolso.position.set(0, -0.14, 0.014); this.tronco.add(bolso);
    }
    if (l.cima === "moletom") { const capuz = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 10, 28), toon(l.roupa2 ?? l.roupa)); capuz.rotation.x = Math.PI / 2 - 0.4; capuz.position.set(0, 0.5, -0.05); this.tronco.add(capuz); }
    // cabeça grande, pescoço curto
    const cy = 0.19, cr = C.cab;
    this.tronco.add(this.cabeca); this.cabeca.position.y = 0.52 * (C.peito.y / 1.35);
    const pesc = tubo(0.045 * (l.masc ? 1.15 : 1), 0.06, l.pele); pesc.position.y = 0.06; this.cabeca.add(pesc);
    const cab = esf(cr, l.pele, V(1, 1.06, 0.98)); cab.material = toonRosto(l.pele); cab.position.y = cy; this.cabeca.add(cab);
    for (const s of [-1, 1]) { const o = esf(0.034, l.pele, V(0.5, 1, 0.9)); o.material = toonRosto(l.pele); o.position.set(cr * 0.99 * s, cy - 0.01, -0.01); this.cabeca.add(o); }
    this.cabelo(l, cr, cy);
    // rosto: calota na frente da cabeça
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 1024; this.ctx = cv.getContext("2d")!; this.ctx.scale(2, 2);
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const geo = new THREE.SphereGeometry(cr + 0.0015, 48, 24, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.2, Math.PI * 0.52);
    const rosto = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.3, depthWrite: false }));
    rosto.scale.set(1, 1.06, 0.98); rosto.position.y = cy; rosto.layers.set(NOINK); rosto.renderOrder = 2; this.cabeca.add(rosto);
    // braços: ombro redondo, manga (curta, comprida ou nenhuma), braço em tubo, mão-luva
    const k = C.ombro / 0.2, mangaCor = l.cima === "regata" ? l.pele : l.roupa, longa = l.cima === "moletom";
    for (const [ombro, cot, m, s] of [[this.ombroE, this.cotoveloE, this.maoE, 1], [this.ombroD, this.cotoveloD, this.maoD, -1]] as const) {
      ombro.position.set(C.ombro * s, 0.44 * (C.peito.y / 1.35), 0); this.tronco.add(ombro);
      ombro.add(esf(0.078 * Math.min(k, 1.1), mangaCor));
      if (l.cima !== "regata") { const manga = tubo(0.066 * Math.min(k, 1.1), 0.1, l.roupa, 0.06); manga.position.y = -0.02; ombro.add(manga); }
      else { const alca = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.13), toon(l.roupa)); alca.position.set(-0.04 * s, 0.065, 0); ombro.add(alca); }
      const braco = tubo(0.056, 0.16, longa ? l.roupa : l.pele, 0.052); braco.position.y = -0.12; ombro.add(braco);
      cot.position.y = -0.28; ombro.add(cot); cot.add(tubo(0.052, 0.2, longa ? l.roupa : l.pele, longa ? 0.05 : 0.046));
      if (longa) { const punho = tubo(0.055, 0.04, l.roupa2 ?? l.roupa); punho.position.y = -0.17; cot.add(punho); }
      if (s === 1 && l.relogio) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), toon(l.relogio)); r.rotation.x = Math.PI / 2; r.position.y = -0.17; cot.add(r); }
      if (s === -1 && l.pulseira) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.008, 6, 20), toon(l.pulseira)); r.rotation.x = Math.PI / 2; r.position.y = -0.19; cot.add(r); }
      m.position.y = -0.24; cot.add(m); m.add(luva(l.luvas ?? l.pele, s));
    }
    if (l.corpo === "crianca") this.root.scale.setScalar(1.15);
    this.expressao("neutro"); this.pose({});
  }
  /** cabelo: sempre um volume só, com o contorno irregular quando é cacheado */
  private cabelo(l: Look, cr: number, cy: number) {
    const k = cr / 0.165, cab = this.cabeca;
    if (l.penteado !== "careca") {
      const capa = new THREE.Mesh(new THREE.SphereGeometry(0.175 * k, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), toon(l.cabelo));
      capa.scale.set(1.02, 1.05, 1.04); capa.position.set(0, cy + 0.015, -0.025); capa.rotation.x = l.penteado === "curto" ? -0.32 : -0.48; cab.add(capa);
      const nuca = esf(0.15 * k, l.cabelo, V(1.04, 0.95, 0.75)); nuca.position.set(0, cy - 0.02, -0.07); cab.add(nuca);
      for (const s of [-1, 1]) { const lado = esf(0.06 * k, l.cabelo, V(0.55, l.penteado === "curto" ? 0.9 : 1.3, 1.0)); lado.position.set(0.15 * k * s, cy + 0.05, 0.02); cab.add(lado); }
      if (l.penteado !== "bobes" && !l.bone) { const franja = esf(0.07 * k, l.cabelo, V(1.9, 0.5, 0.8)); franja.position.set(0.045, cy + 0.155 * k, 0.075); franja.rotation.z = 0.25; cab.add(franja); }
    } else { // careca: coroa de cabelo nos lados e atrás
      const geo = new THREE.TorusGeometry(0.152 * k, 0.045, 10, 30, Math.PI * 1.3); geo.rotateZ(-0.15 * Math.PI); // arco só nos lados e atrás
      const coroa = new THREE.Mesh(geo, toon(l.cabelo)); coroa.rotation.x = -Math.PI / 2; coroa.position.set(0, cy + 0.0, -0.005); cab.add(coroa);
    }
    if (l.penteado === "coque") {
      const kq = esf(0.075 * k, l.cabelo, V(1, 0.92, 0.95)); kq.position.set(0, cy + 0.17 * k, -0.1); cab.add(kq);
      if (l.presilha) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.022, 0.03), toon(l.presilha)); p.position.set(0, cy + 0.135, -0.06); p.rotation.x = -0.6; cab.add(p); }
    }
    if (l.penteado === "rabo") { for (const [y, z, r] of [[0.0, -0.17, 0.05], [-0.07, -0.19, 0.045], [-0.14, -0.18, 0.035]] as const) { const e = esf(r * k, l.cabelo, V(1, 1.3, 0.9)); e.position.set(0, cy + y, z); cab.add(e); } }
    if (l.penteado === "cacheado") { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const e = esf(0.055 * k, l.cabelo); e.position.set(Math.cos(a) * 0.14 * k, cy + 0.14 + Math.sin(i * 1.7) * 0.025, Math.sin(a) * 0.12 * k - 0.03); if (Math.sin(a) < 0.7) cab.add(e); }
      for (const [x, z] of [[0, 0], [0.06, 0.05], [-0.06, 0.04], [0.02, -0.07]] as const) { const t = esf(0.06 * k, l.cabelo); t.position.set(x, cy + 0.19 * k, z); cab.add(t); } }
    if (l.penteado === "bobes") { // bobes cor-de-rosa em cima da cabeça
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + (i % 4) * 0.6, linha = i < 4 ? 0 : 1;
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.038 * k, 0.038 * k, 0.11 * k, 16), toon(l.bobes ?? "#e88aa8"));
        b.rotation.z = Math.PI / 2; b.position.set(Math.sin(a) * 0.1 * k + (linha ? 0.05 : 0), cy + (linha ? 0.13 : 0.165) * k, Math.cos(a) * (linha ? -0.09 : 0.02) * k - linha * 0.04); cab.add(b);
      }
    }
    if (l.bone) { // boné: copa + aba
      const copa = new THREE.Mesh(new THREE.SphereGeometry(0.178 * k, 32, 14, 0, Math.PI * 2, 0, Math.PI * 0.46), toon(l.bone)); copa.position.y = cy + 0.02; cab.add(copa);
      const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * k, 0.12 * k, 0.015, 24, 1, false, -Math.PI / 2, Math.PI), toon(escurecer(l.bone, 0.8))); aba.position.set(0, cy + 0.095, 0.115 * k); aba.rotation.x = 0.18; cab.add(aba);
    }
  }
  expressao(e: Expressao) { if (e === this.chave) return; this.chave = e; desenharRosto(this.ctx, this.l, e); this.tex.needsUpdate = true; }
  pose(p: Pose) {
    const a = (g: THREE.Object3D, v?: [number, number, number]) => g.rotation.set(R(v?.[0] ?? 0), R(v?.[1] ?? 0), R(v?.[2] ?? 0));
    a(this.tronco, p.tronco ?? [this.curva, 0, 0]); a(this.cabeca, p.cabeca ?? [-this.curva * 0.7, 0, 0]);
    a(this.ombroE, p.ombroE ?? [0, 0, 10]); a(this.ombroD, p.ombroD ?? [0, 0, -10]);
    this.cotoveloE.rotation.set(R(p.cotoveloE ?? 0), 0, 0); this.cotoveloD.rotation.set(R(p.cotoveloD ?? 0), 0, 0);
    a(this.coxaE, p.coxaE); a(this.coxaD, p.coxaD);
    this.joelhoE.rotation.set(R(p.joelhoE ?? 0), 0, 0); this.joelhoD.rotation.set(R(p.joelhoD ?? 0), 0, 0);
  }
}

// ---------- exemplos de Look (troque à vontade; crie os da sua história a partir deles) ----------
export const EXEMPLO_MULHER: Look = {
  pele: "#c48a62", cabelo: "#2a1d17", roupa: "#5f8fbf", roupa2: "#44709c", calca: "#2f3442", calcado: "#3a3a40", tenis: true,
  olhos: "#3a2216", labios: "#9b4a44", corpo: "adulta", penteado: "rabo",
};
export const EXEMPLO_HOMEM: Look = {
  pele: "#a8704c", cabelo: "#1e1612", roupa: "#7a8a5a", roupa2: "#5f6d44", calca: "#3a4458", calcado: "#3a2a1e", tenis: true,
  olhos: "#2c1a12", corpo: "adulto", penteado: "curto", masc: true,
};
export const EXEMPLO_IDOSO: Look = {
  pele: "#d0a07e", cabelo: "#d9d6d0", roupa: "#d8d0b8", roupa2: "#b5ac92", calca: "#6b5a48", calcado: "#5a3e2a",
  olhos: "#2f1f16", corpo: "idoso", penteado: "careca", bigode: "#d9d6d0", oculos: true, rugas: true, masc: true,
};
export const EXEMPLO_CRIANCA: Look = {
  pele: "#b78160", cabelo: "#2a1a14", roupa: "#f2c84a", roupa2: "#d9a92a", calca: "#4a6aa8", calcado: "#f5f0f2", tenis: true,
  olhos: "#2f1f16", corpo: "crianca", penteado: "cacheado",
};

// ---------- poses prontas (graus) ----------
/** carregando algo com as duas mãos na frente do corpo */
export const CARREGANDO: Pose = { ombroE: [-30, 0, -6], ombroD: [-30, 0, 6], cotoveloE: -78, cotoveloD: -78, cabeca: [6, 0, 0] };
/** sentado (o quadril fica na altura do assento) */
export const SENTADO: Pose = { coxaE: [-88, 0, 4], coxaD: [-88, 0, -4], joelhoE: 88, joelhoD: 88, ombroE: [-20, 0, 12], ombroD: [-20, 0, -12], cotoveloE: -50, cotoveloD: -50 };
/** empurrando algo: braços para a frente */
export const EMPURRANDO: Pose = { ombroE: [-62, 0, 6], ombroD: [-62, 0, -6], cotoveloE: -22, cotoveloD: -22, tronco: [8, 0, 0] };
/** olhando o celular na mão direita */
export const CELULAR: Pose = { ombroD: [-55, 0, -10], cotoveloD: -80, cabeca: [14, 0, 0] };
/** mão estendida para a frente */
export const MAO_ESTENDIDA: Pose = { ombroE: [-80, 0, 10], cotoveloE: -5 };

/** passo de caminhada: some à pose base. fase = tempo * velocidade (4 a 5 = andar normal) */
export const passo = (fase: number, base: Pose = {}, amp = 18): Pose => {
  const s = Math.sin(fase);
  return { ...base, coxaE: [-amp * s, 0, 2], coxaD: [amp * s, 0, -2], joelhoE: Math.max(0, amp * 1.2 * Math.sin(fase - 1.2)), joelhoD: Math.max(0, amp * 1.2 * Math.sin(fase + Math.PI - 1.2)), tronco: [3, s * 2, 0] };
};
