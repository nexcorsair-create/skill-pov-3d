// lente olho-de-peixe e vinheta, por cima da imagem 3D.
//
// Como funciona: a cena é renderizada com uma câmera comum muito aberta (retilínea). Este efeito "dobra" a imagem
// para o modelo estereográfico (r = k * tan(θ/2)), que é o olho-de-peixe mais natural: o centro fica quase sem
// distorção e as bordas curvam. Os cantos da tela mostram exatamente THETA_MAX graus a partir do centro.
// A câmera precisa usar o campo de visão de `fovParaLente()`, senão os cantos ficam fora da imagem.
import * as THREE from "three";
import { BlendFunction, Effect } from "postprocessing";

/** Ângulo (graus) do centro até o canto da tela. 65 = forte, como a referência. */
export const THETA_MAX = 65;

const ASPECT = 1080 / 1920;
/** raio do canto, em unidades de meia altura da tela */
const RC = Math.hypot(ASPECT, 1);

/** Campo de visão VERTICAL (graus) que a câmera retilínea precisa ter para cobrir os cantos da lente. */
export const fovParaLente = (thetaMax = THETA_MAX) => {
  const f = RC / Math.tan(THREE.MathUtils.degToRad(thetaMax)); // distância focal retilínea, em meias alturas
  return THREE.MathUtils.radToDeg(2 * Math.atan(1 / f));
};

const frag = /* glsl */ `
uniform float k;        // escala estereográfica (meias alturas)
uniform float fRect;    // distância focal da câmera retilínea (meias alturas)
uniform float vinheta;  // 0 = sem, 1 = forte
void mainUv(inout vec2 uv) {
  vec2 a = vec2(aspect, 1.0);
  vec2 p = (uv - 0.5) * 2.0 * a;         // posição na tela de saída, em meias alturas
  float r = length(p);
  if (r < 1e-5) return;
  float th = 2.0 * atan(r / k);           // ângulo que este ponto enxerga
  float rIn = fRect * tan(th);            // onde esse ângulo está na imagem retilínea
  uv = 0.5 + (p / r) * rIn / (2.0 * a);
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 q = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
  float d = length(q) / ${RC.toFixed(5)};
  float v = 1.0 - vinheta * smoothstep(0.55, 1.05, d);
  outputColor = vec4(inputColor.rgb * v, inputColor.a);
}`;

export class LenteEffect extends Effect {
  constructor(thetaMax = THETA_MAX, vinheta = 0.35) {
    const t = THREE.MathUtils.degToRad(thetaMax);
    super("LenteEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["k", new THREE.Uniform(RC / Math.tan(t / 2))],
        ["fRect", new THREE.Uniform(RC / Math.tan(t))],
        ["vinheta", new THREE.Uniform(vinheta)],
      ]),
    });
  }
  set vinheta(v: number) { this.uniforms.get("vinheta")!.value = v; }
  /** zoom: menos graus do centro ao canto = mais perto. A câmera precisa usar fovParaLente(thetaMax) junto. */
  set thetaMax(graus: number) {
    const t = THREE.MathUtils.degToRad(graus);
    this.uniforms.get("k")!.value = RC / Math.tan(t / 2); this.uniforms.get("fRect")!.value = RC / Math.tan(t);
  }
}
