// EXEMPLO COMPLETO (15 s, sem áudio): mostra todas as peças do kit juntas numa cena POV de terror.
// Serve de ponto de partida: copie esta pasta para src/<sua-historia>/ e troque cenário, regra, falas e voto.
//
//   0,0  quadro 0 já estranho: 2h14, o celular aceso na sua mão
//   0,8  ALERTA com a regra (no celular e por cima da tela); 3,6 a regra voa para o canto
//   4,4  batidas na porta: você vira a cabeça para a porta
//   6,2  "Abre aí. Sou eu, teu irmão." (a voz vem da porta)
//   7,6  você olha pela janela... e ELE está lá fora, parado no poste (já estava lá no quadro 0: pista plantada)
//   9,5  a câmera lenta começa: o MUNDO desacelera, o olhar e as vozes não
//  12,0  cartão de voto
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { InkPass } from "../kit/ink";
import { fovParaLente, LenteEffect } from "../kit/lente";
import { GradeEffect, GRADE_NOITE } from "../kit/grade";
import { ceuNoturno, GraoEffect, halo, texReboco, texTerra } from "../kit/textura";
import { EXEMPLO_HOMEM, Personagem, passo, toon } from "../kit/personagem";
import { Celular } from "../kit/celular";
import { balanco, camera, Chave, entre, tempoMundo } from "../kit/tempo";
import { AlertaRegra, CartaoVoto, Escuro, Painel, Palpebras, piscada, RegrasFixas } from "../kit/Avisos";
import { Fala, LegendaFalada } from "../kit/Legenda";
import { definirIdioma, Idioma, T } from "../kit/idioma";

export const EXEMPLO_DURACAO = 15;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const LENTO = { ini: 9.5, fim: 10.5, ritmo: 0.18 };
const tm = tempoMundo(LENTO);
const CARTAO = 12.0;

// ---------------- cenário: quarto 4 x 4 m, janela e porta na parede da frente (z = -2), rua lá fora ----------------
function quarto() {
  const g = new THREE.Group();
  const parede = (w: number, h: number, cor: string) => { const t = texReboco(cor).clone(); t.needsUpdate = true; t.repeat.set(w / 1.5, h / 1.5); return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), new THREE.MeshLambertMaterial({ map: t })); };
  const piso = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), toon("#8a6a4e")); piso.position.y = -0.05; g.add(piso);
  const fundo = parede(4, 2.7, "#9fb4a8"); fundo.position.set(0, 1.35, 2); g.add(fundo);
  for (const s of [-1, 1]) { const p = parede(4, 2.7, "#9fb4a8"); p.rotation.y = Math.PI / 2; p.position.set(2 * s, 1.35, 0); g.add(p); }
  // parede da frente com o vão da janela (x -1,6 a -0,4; y 1,0 a 2,0) e o vão da porta (x 0,5 a 1,4; y 0 a 2,1)
  const pf = (x0: number, x1: number, y0: number, y1: number) => { const p = parede(x1 - x0, y1 - y0, "#9fb4a8"); p.position.set((x0 + x1) / 2, (y0 + y1) / 2, -2); g.add(p); };
  pf(-2, -1.6, 0, 2.7); pf(-1.6, -0.4, 0, 1.0); pf(-1.6, -0.4, 2.0, 2.7); pf(-0.4, 0.5, 0, 2.7); pf(0.5, 1.4, 2.1, 2.7); pf(1.4, 2, 0, 2.7);
  const teto = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), toon("#cfc9bb")); teto.position.y = 2.75; g.add(teto);
  // grade da janela (lição: a câmera vai chegar perto, então nada de pintura de fundo)
  for (let i = 0; i <= 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0), toon("#2a2c33")); b.position.set(-1.6 + i * 0.3, 1.5, -2.08); g.add(b); }
  // cama, criado-mudo e abajur
  const cama = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 2.0), toon("#5a6fa0")); cama.position.set(-1.4, 0.225, 0.8); g.add(cama);
  const trav = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), toon("#e8e4da")); trav.position.set(-1.4, 0.5, 1.5); g.add(trav);
  const mudo = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.4), toon("#7a5a3e")); mudo.position.set(-1.65, 0.275, -0.5); g.add(mudo);
  const abajur = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 20, 1, true), toon("#f0d9a0")); abajur.position.set(-1.65, 0.78, -0.5); g.add(abajur);
  const luz = new THREE.PointLight("#ffcf8a", 3.2, 6, 1.6); luz.position.set(-1.65, 0.8, -0.5); g.add(luz); g.add(halo(V(-1.65, 0.78, -0.5), 0.9, "#ffd9a0", 0.45));
  // a porta (gira em volta da dobradiça em x = 0,5)
  const porta = new THREE.Group(); porta.position.set(0.5, 0, -2);
  const folha = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.05), toon("#6b4a32")); folha.position.set(0.45, 1.05, 0); porta.add(folha);
  const mac = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), toon("#d8c27a")); mac.position.set(0.8, 1.0, 0.05); porta.add(mac);
  g.add(porta);
  // lá fora: chão, poste com luz laranja, céu, e uma parede escura para o corredor atrás da porta
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: (() => { const t = texTerra().clone(); t.needsUpdate = true; t.repeat.set(20, 20); return t; })() }));
  chao.rotation.x = -Math.PI / 2; chao.position.y = -0.11; g.add(chao);
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.5), toon("#3a3c42")); poste.position.set(-1.6, 2.25, -6.5); g.add(poste);
  const lp = new THREE.PointLight("#ffae5a", 9, 9, 1.4); lp.position.set(-1.6, 4.3, -5.4); g.add(lp); g.add(halo(V(-1.6, 4.35, -6.3), 2.2, "#ffc47a", 0.6)); // luz NA FRENTE dele: contra a luz, o rosto fica escuro
  const corredor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.1), toon("#1a1c24")); corredor.position.set(0.95, 1.2, -3.2); g.add(corredor);
  g.add(ceuNoturno());
  g.add(new THREE.HemisphereLight("#43557a", "#14161c", 0.6));
  return { g, porta };
}

// ---------------- câmera: pontos-chave (onde a cabeça está e para onde olha) ----------------
const CAM: Chave[] = [
  { t: 0, p: V(-0.3, 1.5, 0.6), o: V(-0.28, 0.9, -0.2) },     // olhando o celular na mão
  { t: 4.4, p: V(-0.3, 1.5, 0.6), o: V(-0.28, 0.95, -0.2) },
  { t: 5.3, p: V(-0.3, 1.55, 0.6), o: V(0.95, 1.2, -2.0) },   // batidas: vira para a porta
  { t: 7.4, p: V(-0.28, 1.55, 0.55), o: V(0.95, 1.15, -2.0) },
  { t: 8.4, p: V(-0.6, 1.6, -0.6), o: V(-1.5, 1.5, -6.5) },   // vai até a janela e olha para fora
  { t: 15, p: V(-0.75, 1.6, -1.2), o: V(-1.45, 1.35, -5.6) }, // aproxima devagar (a câmera continua em tempo normal)
];

const Mundo: React.FC = () => {
  const frame = useCurrentFrame(), t = frame / useVideoConfig().fps, w = tm(t); // w = tempo do MUNDO
  const { camera: cam0, scene } = useThree(); const cam = cam0 as THREE.PerspectiveCamera;
  const obj = useMemo(() => {
    const q = quarto();
    const ele = new Personagem(EXEMPLO_HOMEM); ele.expressao("neutro"); q.g.add(ele.root);
    const rig = new THREE.Group();
    const cel = new Celular({ hora: () => "2:14", bateria: () => 63, alerta: { de: 0.8, ate: 99, titulo: T("AVISO URGENTE", "AVISO URGENTE", "URGENT WARNING"), linhas: T("NÃO ABRA|A PORTA", "NO ABRAS|LA PUERTA", "DON'T OPEN|THE DOOR").split("|"), sub: T("Para ninguém.", "Para nadie.", "For anyone.") } });
    rig.add(cel.root);
    return { ...q, ele, rig, cel };
  }, []);
  const fx = useMemo(() => ({ ink: new InkPass(scene, cam, { color: "#1c2340", widthNear: 7.5, widthFar: 5, creaseScale: 0.55 }), lente: new LenteEffect(62, 0.4), grade: new GradeEffect(GRADE_NOITE), grao: new GraoEffect(0.018) }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  scene.background = new THREE.Color("#0a0f1c"); scene.fog = new THREE.Fog("#121a2a", 14, 60); fx.grao.quadro = frame;

  // a porta treme com as batidas (tempo do mundo)
  const bate = [4.4, 4.75, 5.1, 6.0, 6.3].some((b) => w > b && w < b + 0.12);
  obj.porta.rotation.y = bate ? -0.012 : 0;
  // ele: parado no poste; na câmera lenta dá passos em direção à janela (o andar usa o tempo do mundo)
  const anda = entre(w, 9.6, 10.0);
  obj.ele.root.position.set(-1.5, 0, -6.3 + Math.max(0, w - 9.6) * 0.55);
  obj.ele.root.rotation.y = 0;
  obj.ele.pose(anda > 0 ? passo(w * 4.4, {}, 16 * anda) : {});

  // câmera em tempo normal + respiração
  const c = camera(CAM, t), b = balanco(t, entre(t, 7.4, 7.6) * (1 - entre(t, 8.3, 8.5)));
  cam.position.copy(c.p); cam.lookAt(c.o); cam.translateX(b.x); cam.translateY(b.y);
  cam.fov = fovParaLente(62); fx.lente.thetaMax = 62; cam.near = 0.03; cam.far = 200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  obj.rig.position.copy(cam.position); obj.rig.quaternion.copy(cam.quaternion); obj.rig.updateMatrixWorld(true);

  // o celular: na mão até 4,6, depois desce para fora do quadro
  const desce = entre(t, 4.4, 5.0), vib = t > 0.8 && t < 2.0 ? Math.sin(t * 95) * 0.003 : 0;
  obj.cel.atualiza(t); obj.cel.root.visible = desce < 0.99;
  obj.cel.root.position.set(vib, -0.05 - desce * 0.3, -0.2);
  obj.cel.root.lookAt(obj.rig.localToWorld(V(0, 0.1, 0.3))); obj.cel.root.rotateZ(0.06);

  return (<><primitive object={obj.g} dispose={null} /><primitive object={obj.rig} dispose={null} />
    <EffectComposer multisampling={4}><primitive object={fx.ink} dispose={null} /><primitive object={fx.lente} dispose={null} /><primitive object={fx.grade} dispose={null} /><primitive object={fx.grao} dispose={null} /></EffectComposer></>);
};

const VOCE = "#ffc23d", PORTA = "#c9a8ff";
/** espalha as palavras de uma frase entre t0 e t1 (num episódio de verdade, os tempos vêm do faster-whisper) */
const frase = (t0: number, t1: number, texto: string): [number, string][] => {
  const ws = texto.split(" "), tot = ws.reduce((s, x) => s + x.length + 2, 0); let acc = t0;
  return ws.map((x) => { const r: [number, string] = [+acc.toFixed(2), x]; acc += (t1 - t0) * (x.length + 2) / tot; return r; });
};
const falas = (): Fala[] => [
  { quem: T("Voz na porta", "Voz en la puerta", "Voice at the door"), cor: PORTA, tom: T("calmo demais", "demasiado tranquilo", "too calm"), palavras: frase(6.2, 7.9, T("Abre aí. Sou eu, teu irmão.", "Abre. Soy yo, tu hermano.", "Open up. It's me, your brother.")), fim: 8.4 },
  { quem: T("Você", "Tú", "You"), cor: VOCE, tom: T("sussurrando", "susurrando", "whispering"), palavras: frase(8.9, 10.6, T("Mas... ele tá lá fora.", "Pero... él está afuera.", "But... he's outside.")), fim: 11.6 },
];

export const Exemplo: React.FC<{ idioma?: Idioma }> = ({ idioma = "pt" }) => {
  definirIdioma(idioma);
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: t > CARTAO ? `blur(${Math.min(8, (t - CARTAO) * 14).toFixed(1)}px)` : undefined }}>
        <ThreeCanvas width={1080} height={1920} dpr={1} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 90, near: 0.03, far: 200 }}><Mundo /></ThreeCanvas>
      </AbsoluteFill>
      <Painel episodio={T("PARTE 1", "PARTE 1", "PART 1")} hora="2:14" lugar={T("SEU QUARTO", "TU CUARTO", "YOUR ROOM")} />
      <AlertaRegra de={0.8} apita={2.0} sai={3.6} n={1} titulo={T("AVISO URGENTE", "AVISO URGENTE", "URGENT WARNING")} texto={T("NÃO ABRA A PORTA", "NO ABRAS LA PUERTA", "DON'T OPEN THE DOOR")} sub={T("Para ninguém.", "Para nadie.", "For anyone.")} />
      <RegrasFixas regras={[{ n: 1, texto: T("NÃO ABRA A PORTA", "NO ABRAS LA PUERTA", "DON'T OPEN THE DOOR"), de: 4.05 }]} />
      {t < CARTAO && <LegendaFalada falas={falas()} />}
      <Palpebras fechado={piscada(t, 7.45, 0.3)} />
      <Escuro a={0} b={0.6} />
      <CartaoVoto de={CARTAO} pergunta={T("O QUE VOCÊ FAZ?", "¿QUÉ HACES?", "WHAT DO YOU DO?")}
        a={{ cor: "#2b5fa8", icone: "🚪", linha1: T("ABRIR A PORTA", "ABRIR LA PUERTA", "OPEN THE DOOR"), linha2: T("E VER QUEM É", "Y VER QUIÉN ES", "AND SEE WHO IT IS"), palavra: T("ABRIR", "ABRIR", "OPEN") }}
        b={{ cor: "#b3121b", icone: "🛏️", linha1: T("SE ESCONDER", "ESCONDERTE", "HIDE"), linha2: T("DEBAIXO DA CAMA", "BAJO LA CAMA", "UNDER THE BED"), palavra: T("ESCONDER", "ESCONDER", "HIDE") }} />
    </AbsoluteFill>
  );
};
