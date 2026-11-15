// CELULAR 3D com a tela desenhada quadro a quadro (desenho próprio, sem marca de aplicativo).
// O celular é o motor das histórias POV: alerta com a regra, mensagens, áudios, ligações, bateria caindo.
// Uso: const cel = new Celular({ hora: () => "2:14", bateria: () => 63, alerta: {...} }); rig.add(cel.root);
//      a cada quadro: cel.atualiza(t). A tela não ganha contorno (camada NOINK) e brilha no escuro.
import * as THREE from "three";
import { NOINK } from "./ink";
import { toon } from "./personagem";
import { CoresMaos, maoSegurandoCelular, MAOS } from "./bracos";

const W = 480, H = 1012;
export type Mensagem = { t: number; quem: string; cor: string; texto: string };
export type TelaCelular = {
  hora: (t: number) => string;
  bateria?: (t: number) => number;
  alerta?: { de: number; ate: number; titulo: string; linhas: string[]; sub?: string };
  conversa?: { de: number; nome: string; msgs: Mensagem[] };
  apagaDe?: number;
};
const F = (peso: number, tam: number) => `${peso} ${tam}px 'Segoe UI', 'Segoe UI Emoji', Arial`;

function quebra(c: CanvasRenderingContext2D, txt: string, larg: number) {
  const out: string[] = []; let linha = "";
  for (const p of txt.split(" ")) { const x = linha ? linha + " " + p : p; if (c.measureText(x).width > larg && linha) { out.push(linha); linha = p; } else linha = x; }
  if (linha) out.push(linha); return out;
}
function barra(c: CanvasRenderingContext2D, hora: string, bat: number, claro: boolean) {
  c.fillStyle = claro ? "#111" : "#fff"; c.font = F(700, 30); c.textBaseline = "middle"; c.textAlign = "left"; c.fillText(hora, 28, 36);
  c.textAlign = "right"; c.fillText(`${Math.round(bat)}%`, W - 82, 36);
  c.strokeStyle = c.fillStyle as string; c.lineWidth = 3; c.strokeRect(W - 72, 24, 44, 24); c.fillRect(W - 69, 27, 38 * bat / 100, 18);
}

export class Celular {
  root = new THREE.Group(); private c: CanvasRenderingContext2D; private tex: THREE.CanvasTexture; private chave = "";
  constructor(private tela: TelaCelular, maos: CoresMaos | null = MAOS) {
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.155, 0.008), toon("#1a1c22")); this.root.add(corpo);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; this.c = cv.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(0.069, 0.146), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    vidro.position.z = 0.0042; vidro.layers.set(NOINK); this.root.add(vidro);
    if (maos) this.root.add(maoSegurandoCelular(maos));
  }
  atualiza(t: number) {
    const T = this.tela, hora = T.hora(t), bat = T.bateria?.(t) ?? 63;
    const modo = T.apagaDe !== undefined && t >= T.apagaDe ? "apagado" : T.alerta && t >= T.alerta.de && t < T.alerta.ate ? "alerta" : T.conversa && t >= T.conversa.de ? "conversa" : "bloqueio";
    const nMsgs = modo === "conversa" ? T.conversa!.msgs.filter((m) => t >= m.t).length : 0;
    const k = `${modo}|${hora}|${Math.round(bat)}|${nMsgs}`; if (k === this.chave) return; this.chave = k;
    const c = this.c; c.clearRect(0, 0, W, H);
    if (modo === "apagado") { c.fillStyle = "#020203"; c.fillRect(0, 0, W, H); }
    else if (modo === "alerta") {
      const a = T.alerta!; c.fillStyle = "#b3121b"; c.fillRect(0, 0, W, H); barra(c, hora, bat, false);
      c.fillStyle = "#fff"; c.textAlign = "center"; c.font = F(800, 34); c.fillText("⚠ " + a.titulo, W / 2, 210);
      c.font = F(900, 64); a.linhas.forEach((l, i) => c.fillText(l, W / 2, 330 + i * 78));
      if (a.sub) { c.font = F(600, 30); c.fillText(a.sub, W / 2, 360 + a.linhas.length * 78); }
    } else if (modo === "conversa") {
      const cv = T.conversa!; c.fillStyle = "#0f1a1f"; c.fillRect(0, 0, W, H); barra(c, hora, bat, false);
      c.fillStyle = "#1d2b33"; c.fillRect(0, 64, W, 80); c.fillStyle = "#fff"; c.font = F(700, 32); c.textAlign = "left"; c.fillText(cv.nome, 28, 104);
      let y = H - 40; c.font = F(500, 28);
      for (const m of cv.msgs.filter((m) => t >= m.t).reverse()) {
        const ls = quebra(c, m.texto, W - 120), h = 44 + ls.length * 34; y -= h + 16; if (y < 150) break;
        c.fillStyle = "#24343d"; c.beginPath(); c.roundRect(20, y, W - 80, h, 18); c.fill();
        c.fillStyle = m.cor; c.font = F(700, 24); c.fillText(m.quem, 38, y + 26);
        c.fillStyle = "#e9eef2"; c.font = F(500, 28); ls.forEach((l, i) => c.fillText(l, 38, y + 60 + i * 34));
      }
    } else {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1b2340"); g.addColorStop(1, "#0a0d18"); c.fillStyle = g; c.fillRect(0, 0, W, H);
      barra(c, hora, bat, false); c.fillStyle = "#fff"; c.textAlign = "center"; c.font = F(300, 120); c.fillText(hora, W / 2, 260);
    }
    this.tex.needsUpdate = true;
  }
}
