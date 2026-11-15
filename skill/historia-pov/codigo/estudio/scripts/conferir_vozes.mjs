// CONFERE se as vozes escolhidas continuam com TAXA 1 (sem multiplicador de crédito). Não gasta créditos.
// Rode antes de cada gravação grande: a taxa de uma voz da biblioteca pode mudar.
// uso (na pasta estudio/): node --env-file=.env.local scripts/conferir_vozes.mjs <vozes.json> [pt|es|en]
import fs from "node:fs";

const [arq, lang = "pt"] = process.argv.slice(2);
if (!arq) { console.error("uso: node --env-file=.env.local scripts/conferir_vozes.mjs <vozes.json> [pt|es|en]"); process.exit(1); }
if (!process.env.ELEVENLABS_API_KEY) throw new Error("chave não encontrada: rode com node --env-file=.env.local");
const cfg = JSON.parse(fs.readFileSync(arq, "utf8"));
const H = { "xi-api-key": process.env.ELEVENLABS_API_KEY };
let problemas = 0;
for (const [quem, v] of Object.entries(cfg[lang] ?? {})) {
  if (!v.voice_id) { console.log(`${quem}: sem voz escolhida`); continue; }
  const nome = v.voz.split(" - ")[0];
  const r = await fetch(`https://api.elevenlabs.io/v1/shared-voices?page_size=100&search=${encodeURIComponent(nome)}&language=${lang}`, { headers: H });
  if (!r.ok) { console.log(`${quem}: erro ${r.status}`); problemas++; continue; }
  const achada = (await r.json()).voices.find((x) => x.voice_id === v.voice_id);
  if (!achada) { console.log(`${quem}: ${v.voz} NÃO encontrada na busca (pode ser voz própria da conta; conferir no site)`); continue; }
  const ok = achada.rate === 1 && !achada.fiat_rate; if (!ok) problemas++;
  console.log(`${quem}: ${v.voz} | taxa ${achada.rate} | ${ok ? "OK, sem custo extra" : "ATENÇÃO: custo diferente, troque a voz"}`);
}
console.log(problemas ? `\n${problemas} problema(s). Créditos gastos: 0` : "\nTudo certo. Créditos gastos: 0");
