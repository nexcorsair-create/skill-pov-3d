// VOZ DE RASCUNHO GRÁTIS: lê o mesmo GRAVACAO.md com a voz do próprio computador, para testar o RITMO do roteiro
// antes de gastar créditos. Não precisa de internet nem de chave.
//   Windows: vozes do sistema (System.Speech). Mac: comando `say`. Linux: espeak-ng.
// Saída: uma faixa com todas as falas em sequência + tempos-rascunho.json (quanto cada fala dura e onde cairia).
//
// uso (na pasta estudio/):
//   node scripts/voz_rascunho.mjs <gravacao.md> <pasta-saida> [--lang pt|es|en] [--acel 1.15] [--listar]
//   --listar mostra as vozes instaladas no computador.
// A voz do computador é robótica e mais lenta que a final: o que importa aqui é a ORDEM, as pausas e o tempo total.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const lang = opt("lang", "pt"), acel = Number(opt("acel", "1.15"));
const so = os.platform();
const CULTURA = { pt: "pt-BR", es: "es-MX", en: "en-US" }[lang] ?? "pt-BR";

const ps = (script) => execFileSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" });
if (args.includes("--listar")) {
  if (so === "win32") console.log(ps("Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | % { $_.VoiceInfo.Name + ' | ' + $_.VoiceInfo.Culture }"));
  else if (so === "darwin") console.log(execFileSync("say", ["-v", "?"], { encoding: "utf8" }));
  else console.log(execFileSync("espeak-ng", ["--voices"], { encoding: "utf8" }));
  process.exit(0);
}
const [roteiro, out] = args;
if (!roteiro || !out) { console.error("uso: node scripts/voz_rascunho.mjs <gravacao.md> <pasta-saida> [--lang pt] [--acel 1.15]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

const sec = fs.readFileSync(roteiro, "utf8").split("## Texto para a voz")[1];
if (!sec) throw new Error("o roteiro não tem a seção '## Texto para a voz'");
const falas = sec.split("\n").filter((l) => l.startsWith(">")).map((l) => {
  const c = l.slice(1).split("|").map((s) => s.trim());
  const texto = c.slice(4).join("|").replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, " ").replace(/\s+/g, " ").trim();
  const [ini, fim] = c[1].split("-").map((x) => Number(x.replace(",", ".")));
  return { cod: c[0], quem: c[2].toUpperCase(), ini, fim, texto };
});

// escolhe uma voz do sistema no idioma (no Windows, pela cultura; no Mac, a primeira do idioma)
let vozWin = null, vozMac = null;
if (so === "win32") {
  const lista = ps("Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | % { $_.VoiceInfo.Name + '|' + $_.VoiceInfo.Culture }").trim().split(/\r?\n/);
  vozWin = (lista.find((l) => l.endsWith(CULTURA)) ?? lista.find((l) => l.split("|")[1]?.startsWith(lang)) ?? lista[0])?.split("|")[0];
  if (!lista.some((l) => l.split("|")[1]?.startsWith(lang))) console.log(`Aviso: não há voz em ${CULTURA} instalada; usando "${vozWin}". Para instalar: Configurações > Hora e idioma > Fala > Adicionar vozes.`);
} else if (so === "darwin") {
  const l = execFileSync("say", ["-v", "?"], { encoding: "utf8" }).split("\n").find((x) => x.includes(CULTURA.replace("-", "_")));
  vozMac = l ? l.split(/\s{2,}/)[0].trim() : null;
}

const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const wavs = [];
for (const f of falas) {
  const bruto = path.join(out, `${f.cod}_bruto.wav`), wav = path.join(out, `${f.cod}.wav`);
  if (so === "win32") {
    const txt = f.texto.replaceAll("'", "''");
    ps(`Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoice('${vozWin}'); $s.SetOutputToWaveFile('${path.resolve(bruto)}'); $s.Speak('${txt}'); $s.Dispose()`);
  } else if (so === "darwin") {
    const aiff = bruto.replace(".wav", ".aiff");
    execFileSync("say", [...(vozMac ? ["-v", vozMac] : []), "-o", aiff, f.texto]); execFileSync("ffmpeg", ["-v", "error", "-y", "-i", aiff, bruto]); fs.rmSync(aiff);
  } else execFileSync("espeak-ng", ["-v", lang, "-w", bruto, f.texto]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", bruto, "-af", `atempo=${acel},aresample=44100`, "-ac", "1", wav]); fs.rmSync(bruto);
  wavs.push({ ...f, wav, dur: dur(wav) });
}
// coloca cada fala no início da janela dela (ou logo depois da anterior, se ainda estiver falando)
let t = 0; const tempos = [];
for (const w of wavs) { const ini = Math.max(w.ini, t + 0.15); tempos.push({ cod: w.cod, quem: w.quem, inicio: +ini.toFixed(2), dura: +w.dur.toFixed(2), janela: [w.ini, w.fim], atraso: +(ini - w.ini).toFixed(2) }); t = ini + w.dur; }
const total = t + 0.5;
const ent = wavs.flatMap((w) => ["-i", w.wav]);
const fil = tempos.map((x, i) => `[${i}:a]adelay=${Math.round(x.inicio * 1000)}:all=1[a${i}]`).join(";") + ";" + tempos.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${tempos.length}:normalize=0,apad=whole_dur=${total.toFixed(2)},atrim=0:${total.toFixed(2)}[o]`;
const faixa = path.join(out, "rascunho.wav");
execFileSync("ffmpeg", ["-v", "error", "-y", ...ent, "-filter_complex", fil, "-map", "[o]", "-ar", "44100", "-ac", "1", faixa]);
fs.writeFileSync(path.join(out, "tempos-rascunho.json"), JSON.stringify({ duracao_s: +total.toFixed(2), falas: tempos }, null, 2));
console.log(`Voz: ${vozWin ?? vozMac ?? "espeak-ng"} | ${falas.length} falas | duração total: ${total.toFixed(1)} s | faixa: ${faixa}`);
for (const x of tempos) console.log(`  ${x.cod} ${x.quem.padEnd(12)} começa ${String(x.inicio).padStart(6)} s, dura ${String(x.dura).padStart(5)} s${x.atraso > 0.3 ? `  (atrasou ${x.atraso} s: não coube na janela)` : ""}`);
console.log("Créditos gastos: 0");
