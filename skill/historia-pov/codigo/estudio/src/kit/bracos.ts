// BRAÇOS EM PRIMEIRA PESSOA (POV). "Você" é a câmera: o público vê as suas mãos e antebraços em quase toda cena.
// A cor da manga é a identidade do protagonista (ele nunca mostra o rosto): escolha uma cor forte e única.
// Sistema local de um braço: +Z = do cotovelo para os dedos, palma para baixo (-Y).
//
// Uso típico (dentro do componente 3D, a cada quadro):
//   const rig = new THREE.Group();              // copia posição e rotação da câmera a cada quadro
//   const mao = bracoPOV(1, MAOS, 0.3); rig.add(mao);
//   rig.position.copy(cam.position); rig.quaternion.copy(cam.quaternion); rig.updateMatrixWorld(true);
//   mao.position.set(0.2, -0.3, -0.1); mao.lookAt(rig.localToWorld(new THREE.Vector3(0.1, -0.1, -0.6)));
// Lições: a mão segura o objeto pela PONTA (no meio, cobre a tela do celular); objeto na mão segue a rotação da mão,
// não só a posição; pegar algo no ar tem peso (a mão vai, afunda um pouco quando chega e volta).
import * as THREE from "three";
import { toon } from "./personagem";

export type CoresMaos = { pele: string; manga: string; punho?: string; pulseira?: string };
/** cores de exemplo: troque pela roupa do seu protagonista */
export const MAOS: CoresMaos = { pele: "#c48a62", manga: "#3f7d6a", punho: "#2f6253" };

const cap = (r: number, len: number, cor: string, r2 = r) => {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, 20), toon(cor)); c.rotation.x = Math.PI / 2; c.position.z = len / 2; g.add(c);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), toon(cor)));
  const b = new THREE.Mesh(new THREE.SphereGeometry(r2, 18, 12), toon(cor)); b.position.z = len; g.add(b);
  return g;
};

/** um braço: manga + punho + mão com 4 dedos e polegar. lado: 1 = direito, -1 = esquerdo.
 *  curva = quanto os dedos dobram (0 = esticados, 1 = agarrando uma barra) */
export function bracoPOV(lado: 1 | -1, L: CoresMaos = MAOS, curva = 0.35) {
  const g = new THREE.Group(); g.scale.setScalar(1.15); // um pouco maior que o real: mão de desenho, legível no celular
  g.add(cap(0.058, 0.42, L.manga, 0.05));
  const punho = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.014, 8, 20), toon(L.punho ?? L.manga)); punho.position.z = 0.42; g.add(punho);
  if (L.pulseira) { const p = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 20), toon(L.pulseira)); p.position.z = 0.455; g.add(p); }
  const mao = new THREE.Group(); mao.position.z = 0.47; g.add(mao);
  const palma = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), toon(L.pele)); palma.scale.set(1.0, 0.45, 1.15); palma.position.z = 0.045; mao.add(palma);
  for (let i = 0; i < 4; i++) {
    const x = (-0.033 + i * 0.022) * lado, len = [0.055, 0.062, 0.058, 0.046][i];
    const base = new THREE.Group(); base.position.set(x, -0.004, 0.095); base.rotation.x = curva * 0.9; mao.add(base);
    base.add(cap(0.0105, len * 0.55, L.pele, 0.0098));
    const ponta = new THREE.Group(); ponta.position.z = len * 0.55; ponta.rotation.x = curva * 1.1; base.add(ponta);
    ponta.add(cap(0.0098, len * 0.45, L.pele, 0.0088));
  }
  const pol = new THREE.Group(); pol.position.set(-0.045 * lado, -0.008, 0.03); pol.rotation.set(curva * 0.5, -0.7 * lado, 0); mao.add(pol);
  pol.add(cap(0.012, 0.06, L.pele, 0.0105));
  return g;
}

/** mão direita SEGURANDO um celular (coordenadas do celular: centro na origem, tela para +Z, 7,5 x 15,5 cm):
 *  quatro dedos abraçando a borda esquerda (as pontas aparecem na frente), polegar na borda direita,
 *  palma escondida atrás e o pulso com a manga descendo para fora do quadro. */
export function maoSegurandoCelular(L: CoresMaos = MAOS) {
  const g = new THREE.Group();
  const seg = (a: THREE.Vector3, b: THREE.Vector3, r: number, cor: string) => {
    const s = new THREE.Group(); s.position.copy(a); s.lookAt(b); s.add(cap(r, a.distanceTo(b), cor, r * 0.92)); g.add(s);
  };
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const palma = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), toon(L.pele)); palma.scale.set(0.042, 0.052, 0.02); palma.position.set(0.006, -0.045, -0.026); g.add(palma);
  for (let i = 0; i < 4; i++) {
    const y = -0.012 - i * 0.02, r = [0.0085, 0.009, 0.0085, 0.0075][i];
    seg(V(0.004, y - 0.006, -0.022), V(-0.04, y, -0.012), r, L.pele);
    seg(V(-0.04, y, -0.012), V(-0.046, y + 0.002, 0.004), r, L.pele);
    seg(V(-0.046, y + 0.002, 0.004), V(-0.033, y + 0.004, 0.011), r * 0.95, L.pele);
  }
  seg(V(0.03, -0.085, -0.016), V(0.044, -0.05, -0.002), 0.011, L.pele);
  seg(V(0.044, -0.05, -0.002), V(0.034, -0.022, 0.011), 0.0102, L.pele);
  const pulso = V(0.012, -0.085, -0.03), longe = V(0.11, -0.44, -0.2);
  seg(pulso, longe, 0.033, L.pele);
  const manga = longe.clone().lerp(pulso, 0.82); seg(manga, longe.clone().add(V(0.06, -0.2, -0.1)), 0.05, L.manga);
  return g;
}
