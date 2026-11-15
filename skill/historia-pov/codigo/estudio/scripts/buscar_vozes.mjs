// BUSCA VOZES na biblioteca do ElevenLabs e monta uma página para OUVIR AS PRÉVIAS DE GRAÇA (não gasta créditos).
// Só lista vozes de taxa 1 (sem multiplicador de crédito): vozes com multiplicador cobram 2x, 3x... por caractere.
//
// uso (na pasta estudio/):
//   node --env-file=.env.local scripts/buscar_vozes.mjs <saida.html> --idioma pt --genero female --idade young --busca "whisper,narration,soft" [--sotaque brazil]
// Dicas:
//   - espanhol latino: --idioma es --sotaque "latin|mexic|colomb" (muitas latinas aparecem como es-AR; o que vale é o sotaque);
//   - personagem que sussurra: --busca "whisper,asmr,soft"; criança/jovem: --idade young.
// A página tem um player por voz e o voice_id para copiar no vozes.json. Escolher pelas prévias e gravar direto
// já funcionou bem (economiza as amostras); se a pessoa quiser ouvir a frase da história, use voz.mjs --modo amostras.
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const saida = args[0];
if (!saida || saida.startsWith("--")) { console.error("uso: node --env-file=.env.local scripts/buscar_vozes.mjs <saida.html> --idioma pt [--genero male|female] [--idade young|middle_aged|old] [--busca a,b] [--sotaque regex]"); process.exit(1); }
if (!process.env.ELEVENLABS_API_KEY) throw new Error("chave não encontrada: rode com node --env-file=.env.local");
const H = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
const idioma = opt("idioma", "pt"), genero = opt("genero", ""), idade = opt("idade", ""), sotaque = opt("sotaque", "");
const buscas = ["", ...opt("busca", "").split(",").filter(Boolean)];

const vistas = new Map();
for (const q of buscas) {
  const u = `https://api.elevenlabs.io/v1/shared-voices?page_size=100&language=${idioma}${genero ? "&gender=" + genero : ""}${idade ? "&age=" + idade : ""}${q ? "&search=" + encodeURIComponent(q) : ""}`;
  const r = await fetch(u, { headers: H });
  if (!r.ok) { console.log("erro", r.status, q, (await r.text()).slice(0, 200)); continue; }
  for (const v of (await r.json()).voices) if (!vistas.has(v.voice_id)) vistas.set(v.voice_id, v);
}
const re = sotaque ? new RegExp(sotaque, "i") : null;
const lista = [...vistas.values()].filter((v) => v.rate === 1 && !v.fiat_rate && (!re || re.test(v.accent ?? "")));
lista.sort((a, b) => (b.cloned_by_count ?? 0) - (a.cloned_by_count ?? 0));
const top = lista.slice(0, 40);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const html = `<!doctype html><meta charset="utf-8"><title>Prévias de vozes</title>
<style>body{font:16px system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;background:#111;color:#eee}
.v{border:1px solid #333;border-radius:10px;padding:12px;margin:10px 0}.n{font-weight:700;font-size:18px}.d{color:#aaa;font-size:14px}code{background:#222;padding:2px 6px;border-radius:4px}</style>
<h1>Prévias de vozes (${esc(idioma)}${genero ? ", " + esc(genero) : ""}${idade ? ", " + esc(idade) : ""})</h1>
<p>Todas com taxa 1. Ouça e anote o nome de quem você gostou. As prévias são grátis.</p>
${top.map((v) => `<div class="v"><div class="n">${esc(v.name)}</div><div class="d">${esc(v.age)} · ${esc(v.accent)} · ${esc(v.use_case)} · usada ${esc(v.cloned_by_count)} vezes</div>
<div class="d">${esc((v.description ?? "").slice(0, 200))}</div>${v.preview_url ? `<audio controls preload="none" src="${esc(v.preview_url)}"></audio>` : "<i>sem prévia</i>"}
<div class="d">voice_id: <code>${esc(v.voice_id)}</code></div></div>`).join("\n")}`;
fs.writeFileSync(saida, html);
fs.writeFileSync(saida.replace(/\.html?$/, "") + ".json", JSON.stringify(top.map((v) => ({ voz: v.name, voice_id: v.voice_id, idade: v.age, sotaque: v.accent, uso: v.use_case, previa: v.preview_url })), null, 2));
console.log(`${lista.length} vozes com taxa 1 encontradas; as ${top.length} mais usadas estão em ${saida}. Créditos gastos: 0`);
