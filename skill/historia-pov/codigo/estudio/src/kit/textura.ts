// ACABAMENTO: texturas pintadas por código (sem baixar imagens), céu noturno, neblina, halos de luz e grão.
// O vídeo parecia "chapado" por falta de textura, movimento e objetos, não por causa da cor: use estas texturas
// no chão e nas paredes, e halos em toda lâmpada.
//   texConcreto(), texAsfalto(), texTerra(), texMato(), texReboco(cor)  -> THREE.CanvasTexture (repete sem costura)
//   ceuNoturno() -> esfera de céu + estrelas     neblina() -> THREE.Fog     halo(pos, tam, cor) -> brilho da lâmpada
//   new GraoEffect(0.02) -> grão de câmera de celular à noite (atualize .quadro = frame a cada quadro)
import * as THREE from "three";
import { BlendFunction, Effect } from "postprocessing";
import { NOINK } from "./ink";

// ---------------- texturas pintadas ----------------
const rng = (seed: number) => { let s = seed % 2147483647 || 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };
const cache = new Map<string, THREE.CanvasTexture>();
const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  let t = cache.get(key);
  if (!t) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d")!, rng(key.length * 977 + key.charCodeAt(0) * 31));
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    cache.set(key, t);
  }
  return t;
};
/** manchas suaves (pinceladas redondas) para quebrar a cor chapada */
const manchas = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, cor: string, rMin: number, rMax: number, alfa: number) => {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMin + r() * (rMax - rMin);
    for (const [dx, dy] of [[0, 0], [-w, 0], [w, 0], [0, -h], [0, h]]) { // repete nas bordas: a textura emenda sem costura
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      gr.addColorStop(0, cor.replace("A", String(alfa * (0.5 + r() * 0.5)))); gr.addColorStop(1, cor.replace("A", "0"));
      g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
};
const pontinhos = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, cores: string[], tam: number) => {
  for (let i = 0; i < n; i++) { g.fillStyle = cores[Math.floor(r() * cores.length)]; const s = tam * (0.5 + r()); g.fillRect(r() * w, r() * h, s, s); }
};

/** concreto: 1 textura = 4 m x 4 m = 2 x 2 placas, com juntas, manchas de óleo e marcas de pneu */
export const texConcreto = () => ctex("nd-concreto", 1024, 1024, (g, r) => {
  g.fillStyle = "#a9a8a1"; g.fillRect(0, 0, 1024, 1024);
  for (const [px, py] of [[0, 0], [512, 0], [0, 512], [512, 512]]) { g.fillStyle = ["#aaa9a2", "#a4a39c", "#adaca4", "#a6a59f"][(px + py * 3) % 4 === 0 ? 0 : (px / 512 + py / 256) % 4]; g.fillRect(px, py, 512, 512); }
  manchas(g, r, 1024, 1024, 60, "rgba(120,118,110,A)", 40, 160, 0.25);
  manchas(g, r, 1024, 1024, 40, "rgba(200,198,188,A)", 30, 120, 0.2);
  pontinhos(g, r, 1024, 1024, 9000, ["rgba(80,80,76,0.25)", "rgba(220,218,210,0.3)"], 2.2);
  manchas(g, r, 1024, 1024, 7, "rgba(40,38,36,A)", 30, 90, 0.55); // óleo
  g.strokeStyle = "rgba(60,58,55,0.18)"; g.lineWidth = 26; // marcas de pneu
  for (let i = 0; i < 3; i++) { const y = 150 + r() * 700; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(340, y + 60 * (r() - 0.5), 700, y + 80 * (r() - 0.5), 1024, y); g.stroke(); }
  g.fillStyle = "#5e5d58"; for (const p of [0, 510]) { g.fillRect(p, 0, 5, 1024); g.fillRect(0, p, 1024, 5); } // juntas
  g.strokeStyle = "rgba(70,68,64,0.16)"; g.lineWidth = 1.2; // trincas finas, quase sumindo
  for (let i = 0; i < 5; i++) { let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); }
});
/** asfalto da rodovia (3 m) */
export const texAsfalto = () => ctex("nd-asfalto", 512, 512, (g, r) => {
  g.fillStyle = "#3b3e44"; g.fillRect(0, 0, 512, 512);
  manchas(g, r, 512, 512, 30, "rgba(25,26,30,A)", 30, 110, 0.35);
  manchas(g, r, 512, 512, 20, "rgba(90,92,98,A)", 20, 80, 0.2);
  pontinhos(g, r, 512, 512, 7000, ["rgba(20,20,22,0.5)", "rgba(120,122,128,0.35)", "rgba(70,72,78,0.5)"], 1.8);
});
/** terra batida fora da cobertura (4 m) */
export const texTerra = () => ctex("nd-terra", 512, 512, (g, r) => {
  g.fillStyle = "#2d3036"; g.fillRect(0, 0, 512, 512);
  manchas(g, r, 512, 512, 40, "rgba(58,52,44,A)", 30, 120, 0.4);
  manchas(g, r, 512, 512, 30, "rgba(18,20,24,A)", 30, 100, 0.4);
  pontinhos(g, r, 512, 512, 5000, ["rgba(90,86,78,0.4)", "rgba(15,15,18,0.5)"], 2);
});
/** mato rasteiro (3 m) */
export const texMato = () => ctex("nd-mato", 512, 512, (g, r) => {
  g.fillStyle = "#1d2a22"; g.fillRect(0, 0, 512, 512);
  manchas(g, r, 512, 512, 40, "rgba(40,62,44,A)", 30, 110, 0.45);
  manchas(g, r, 512, 512, 30, "rgba(10,16,14,A)", 30, 100, 0.5);
  for (let i = 0; i < 2500; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = r() < 0.5 ? "rgba(52,80,56,0.55)" : "rgba(12,20,16,0.6)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 4 - r() * 8); g.stroke(); }
});
/** reboco das paredes (2 m), bem leve */
export const texReboco = (cor: string) => ctex("nd-reboco" + cor, 512, 512, (g, r) => {
  g.fillStyle = cor; g.fillRect(0, 0, 512, 512);
  manchas(g, r, 512, 512, 30, "rgba(120,110,95,A)", 30, 120, 0.12);
  manchas(g, r, 512, 512, 20, "rgba(255,255,250,A)", 30, 120, 0.12);
  pontinhos(g, r, 512, 512, 2500, ["rgba(90,85,75,0.15)"], 2);
});

// ---------------- céu, estrelas, neblina ----------------
export function ceuNoturno(): THREE.Object3D {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vD;
      void main(){
        float h = vD.y;
        vec3 alto = vec3(0.0015,0.0025,0.007), meio = vec3(0.004,0.007,0.018), hor = vec3(0.035,0.02,0.016);
        vec3 c = mix(meio, alto, smoothstep(0.05, 0.6, h));
        c = mix(hor, c, smoothstep(-0.02, 0.16, h));
        // brilho de cidade distante no horizonte (-Z)
        float cidade = exp(-pow(max(h,0.0)*9.0,1.4)) * smoothstep(0.2, 1.0, -vD.z) * 0.6;
        c += vec3(0.07,0.03,0.012) * cidade;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(190, 48, 24), mat); ceu.layers.set(NOINK); ceu.renderOrder = -10; ceu.frustumCulled = false; g.add(ceu);
  // estrelas: poucas e fracas
  const r = rng(4711), pos: number[] = [], cor: number[] = [];
  for (let i = 0; i < 260; i++) {
    const az = r() * Math.PI * 2, el = 0.12 + Math.pow(r(), 0.7) * 1.3, R = 180;
    pos.push(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), R * Math.cos(el) * Math.cos(az));
    const b = 0.35 + r() * 0.65; cor.push(b, b, b * (0.9 + r() * 0.2));
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3));
  const est = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0.8, depthWrite: false }));
  est.layers.set(NOINK); est.frustumCulled = false; g.add(est);
  return g;
}
export const neblina = () => new THREE.Fog("#0a0f1a", 22, 95);

// ---------------- halos das luzes ----------------
const texHalo = () => ctex("nd-halo", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, "rgba(255,255,255,0.55)"); gr.addColorStop(0.4, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
export function halo(pos: THREE.Vector3, tam: number, cor: string, forca = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo(), color: cor, transparent: true, opacity: forca, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.position.copy(pos); s.scale.set(tam, tam, 1); s.layers.set(NOINK); s.renderOrder = 5; return s;
}
// ---------------- grão ----------------
const fragGrao = /* glsl */ `
uniform float forca; uniform float semente;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + semente) * 43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = floor(uv * resolution / 1.5);
  float n = h(px) - 0.5;
  float y = dot(inputColor.rgb, vec3(0.2126,0.7152,0.0722));
  float k = forca * (1.0 - 0.6 * smoothstep(0.3, 0.9, y)); // mais grão no escuro, como câmera à noite
  outputColor = vec4(max(inputColor.rgb + n * k, 0.0), inputColor.a);
}`;
export class GraoEffect extends Effect {
  constructor(forca = 0.028) {
    super("GraoEffect", fragGrao, { blendFunction: BlendFunction.NORMAL, uniforms: new Map<string, THREE.Uniform>([["forca", new THREE.Uniform(forca)], ["semente", new THREE.Uniform(0)]]) });
  }
  set quadro(f: number) { this.uniforms.get("semente")!.value = (f % 97) * 1.37; }
}
