// VOZES FINAIS com o ElevenLabs, a partir de um roteiro de gravação (GRAVACAO.md), mantendo as tags de emoção.
// GASTA CRÉDITOS (menos com --simular). Diga o custo estimado à pessoa antes de rodar sem --simular.
//
// O roteiro de gravação tem, na seção "## Texto para a voz", uma linha por fala:
//   > F01 | 0,0-3,0 | ANA | 1 | [whispers] Você ouviu isso?
//   (código | janela na imagem em segundos | quem fala | nível de medo 0-4 | texto com tags em inglês)
// Marcas de montagem entre chaves, como {piscada}, não vão para a voz.
//
// As vozes ficam num vozes.json da história:
//   { "modelo": "eleven_v4_turbo", "pt": { "ANA": { "voz": "Nome", "voice_id": "...", "candidatos": [{ "voz": "...", "voice_id": "..." }] } } }
//
// uso (na pasta estudio/):
//   node scripts/voz.mjs <gravacao.md> <pasta-saida> --vozes <vozes.json> --simular        (não gasta nada: mostra caracteres)
//   node --env-file=.env.local scripts/voz.mjs <gravacao.md> <pasta-saida> --vozes <vozes.json> --modo amostras
//   node --env-file=.env.local scripts/voz.mjs <gravacao.md> <pasta-saida> --vozes <vozes.json> --modo falas [--take 2] [--so F03,F06]
// opções: --lang pt|es|en (padrão pt), --acel 1.00 (máximo 1.30), --sem-tags-tambem (só em falas)
//
// Cache: cada áudio é guardado pelo modelo + voz + texto + tomada. Rodar de novo nunca paga duas vezes.
// Para uma tomada nova da mesma fala, use --take 2, 3... As antigas ficam guardadas.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const [roteiro, out] = args;
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const flag = (n) => args.includes(`--${n}`);
if (!roteiro || !out || !opt("vozes")) { console.error("uso: node scripts/voz.mjs <gravacao.md> <pasta-saida> --vozes <vozes.json> [--simular] [--modo falas|amostras]"); process.exit(1); }
const lang = opt("lang", "pt");
const modo = opt("modo", "falas");
const take = Number(opt("take", "1"));
const acel = Number(opt("acel", "1.00"));
const so = opt("so", "") ? opt("so", "").split(",") : null;
const simular = flag("simular");
if (acel > 1.3) throw new Error("aceleração máxima é 1.30 (acima disso a voz soa artificial)");

const cfg = JSON.parse(fs.readFileSync(path.resolve(opt("vozes")), "utf8"));
const modelo = cfg.modelo ?? "eleven_v4_turbo";
const semTags = (t) => t.replace(/\[[a-z][a-z ,'-]*\]/g, " ").replace(/\s+/g, " ").trim();
const limpar = (t) => t.replace(/\{[^}]*\}/g, " ").replace(/\s+/g, " ").trim();

// ---- lê o roteiro ----
const md = fs.readFileSync(roteiro, "utf8");
const secao = md.split("## Texto para a voz")[1];
if (!secao) throw new Error("o roteiro não tem a seção '## Texto para a voz'");
const falas = secao.split("\n").filter((l) => l.startsWith(">")).map((l) => {
  const c = l.slice(1).split("|").map((s) => s.trim());
  if (c.length < 5) throw new Error(`linha fora do formato: ${l}`);
  const [cod, janela, quem, nivel, ...resto] = c;
  const [ini, fim] = janela.split("-").map((x) => Number(x.replace(",", ".")));
  return { cod, ini, fim, quem: quem.toUpperCase(), nivel: Number(nivel), texto: limpar(resto.join("|")) };
}).filter((f) => !so || so.includes(f.cod));
if (!falas.length) throw new Error("nenhuma fala encontrada");

const vozDe = (quem) => cfg[lang]?.[quem];

// ---- monta a lista de pedidos ----
const pedidos = [];
if (modo === "falas") {
  for (const f of falas) {
    const v = vozDe(f.quem);
    const versoes = [{ rotulo: "", texto: f.texto }];
    if (flag("sem-tags-tambem")) versoes.push({ rotulo: "-sem-tags", texto: semTags(f.texto) });
    for (const ver of versoes)
      pedidos.push({ f, voz: v?.voz, voice_id: v?.voice_id, texto: ver.texto, nome: `${f.cod}_${f.quem}${ver.rotulo}_take${take}` });
  }
} else if (modo === "amostras") {
  const quens = [...new Set(falas.map((f) => f.quem))];
  for (const quem of quens) {
    const cands = vozDe(quem)?.candidatos ?? [];
    if (!cands.length) console.log(`(sem candidatos anotados para ${quem} em vozes.json)`);
    for (const c of cands)
      for (const f of falas.filter((x) => x.quem === quem))
        for (const [rot, tx] of [["com-tags", f.texto], ["sem-tags", semTags(f.texto)]])
          pedidos.push({ f, voz: c.voz, voice_id: c.voice_id, texto: tx, grupo: `${quem}/${c.voz.replace(/[^\w-]+/g, "_")}-${rot}`, nome: `${f.cod}_${rot}` });
  }
} else throw new Error(`modo desconhecido: ${modo}`);

// ---- simulação: mostra tudo e soma os caracteres, sem chamar ninguém ----
const totalChars = pedidos.reduce((s, p) => s + p.texto.length, 0);
console.log(`\nModo: ${modo} | idioma: ${lang} | modelo: ${modelo} | falas: ${falas.length} | pedidos: ${pedidos.length} | caracteres: ${totalChars}`);
for (const f of falas) console.log(`  ${f.cod} ${String(f.ini).padStart(5)}-${String(f.fim).padEnd(5)} medo ${f.nivel} ${f.quem.padEnd(13)} ${f.texto}`);
const faltam = [...new Set(pedidos.filter((p) => !p.voice_id).map((p) => p.f.quem))];
if (modo === "falas" && faltam.length) console.log(`\nSem voz escolhida em vozes.json: ${faltam.join(", ")}`);
if (simular) {
  console.log(`\nSimulação: nada foi enviado ao ElevenLabs. Créditos gastos: 0`);
  console.log(`Estimativa: ${totalChars} caracteres. O custo real por caractere depende do plano e do modelo; o script mostra o custo real de cada fala quando gera.`);
  process.exit(0);
}
if (faltam.length && modo === "falas") throw new Error("escolha as vozes antes de gerar");
if (!process.env.ELEVENLABS_API_KEY) throw new Error("chave não encontrada: rode com node --env-file=.env.local (veja o .env.example)");

// ---- gera ----
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const cache = path.join(out, "cache"); fs.mkdirSync(cache, { recursive: true });
let custo = 0;
for (const p of pedidos) {
  const h = createHash("sha1").update([modelo, p.voice_id, p.texto, take].join("|")).digest("hex").slice(0, 12);
  p.mp3 = path.join(cache, `${h}.mp3`);
  if (!fs.existsSync(p.mp3)) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${p.voice_id}?output_format=mp3_44100_192`, {
      method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text: p.texto, model_id: modelo, language_code: lang }),
    });
    if (!r.ok) throw new Error(`${p.nome}: ${r.status} ${(await r.text()).slice(0, 300)}`);
    fs.writeFileSync(p.mp3, Buffer.from(await r.arrayBuffer()));
    const c = Number(r.headers.get("character-cost") || 0); custo += c;
    console.log(`gerado ${p.nome} (${p.voz}) ${c} créditos`);
  } else console.log(`já existia ${p.nome} (${p.voz})`);
  // corta o silêncio do começo e do fim, mantém as pausas do meio; acelera sem mudar o tom (atempo)
  p.wav = path.join(out, p.grupo ?? "falas", `${p.nome}.wav`); fs.mkdirSync(path.dirname(p.wav), { recursive: true });
  const at = acel > 1 ? `,atempo=${acel}` : "";
  ff("-i", p.mp3, "-af", `silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse${at}`, "-ar", "44100", "-ac", "1", p.wav);
  p.dur = dur(p.wav);
}

// ---- junta para ouvir e mede se cabe na janela ----
const gap = path.join(cache, "gap.wav");
ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.6", gap);
const juntar = (lista, destino) => {
  const lst = destino + ".txt";
  fs.writeFileSync(lst, lista.flatMap((p) => [p.wav, gap]).map((f) => `file '${path.resolve(f).replaceAll("\\", "/")}'`).join("\n"));
  ff("-f", "concat", "-safe", "0", "-i", lst, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "192k", destino);
  fs.rmSync(lst);
};
const grupos = {};
for (const p of pedidos) (grupos[p.grupo ?? `falas${p.nome.includes("sem-tags") ? "-sem-tags" : ""}`] ??= []).push(p);
for (const [g, lista] of Object.entries(grupos)) juntar(lista, path.join(out, `${g.replaceAll("/", "__")}_take${take}.mp3`));

const medidas = pedidos.map((p) => ({ cod: p.f.cod, quem: p.f.quem, voz: p.voz, versao: p.grupo ?? p.nome, arquivo: path.relative(out, p.wav).replaceAll("\\", "/"), janela_s: +(p.f.fim - p.f.ini).toFixed(2), fala_s: +p.dur.toFixed(2), cabe: p.dur <= p.f.fim - p.f.ini }));
fs.writeFileSync(path.join(out, `medidas_${modo}_take${take}.json`), JSON.stringify(medidas, null, 2));
console.log("\nDuração de cada fala contra a janela da imagem:");
for (const m of medidas) console.log(`  ${m.cod} ${m.quem.padEnd(13)} ${String(m.fala_s).padStart(5)} s / janela ${m.janela_s} s ${m.cabe ? "cabe" : "PASSA DA JANELA"}  ${m.versao}`);
console.log(`\nCréditos gastos agora: ${custo}`);
