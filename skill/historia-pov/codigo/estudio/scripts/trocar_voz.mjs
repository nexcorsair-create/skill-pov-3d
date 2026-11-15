// TROCA A VOZ de uma gravação mantendo melodia e ritmo (speech-to-speech do ElevenLabs). GASTA CRÉDITOS.
// Bom para: um personagem cantar exatamente como outro já cantou; refazer uma fala com outra voz sem mudar o tempo.
// Cache: se a saída já existe, não paga de novo.
// uso (na pasta estudio/): node --env-file=.env.local scripts/trocar_voz.mjs <entrada.wav> <voice_id> <saida.mp3>
import fs from "node:fs";

const [entrada, voz, saida] = process.argv.slice(2);
if (!entrada || !voz || !saida) { console.error("uso: node --env-file=.env.local scripts/trocar_voz.mjs <entrada.wav> <voice_id> <saida.mp3>"); process.exit(1); }
if (fs.existsSync(saida)) { console.log("já existe (cache, nada gasto):", saida); process.exit(0); }
if (!process.env.ELEVENLABS_API_KEY) throw new Error("chave não encontrada: rode com node --env-file=.env.local");
const fd = new FormData();
fd.append("audio", new Blob([fs.readFileSync(entrada)], { type: "audio/wav" }), "entrada.wav");
fd.append("model_id", "eleven_multilingual_sts_v2");
fd.append("voice_settings", JSON.stringify({ stability: 0.35, similarity_boost: 0.8, style: 0.4 }));
const r = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voz}?output_format=mp3_44100_192`, { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, body: fd });
if (!r.ok) { console.error("erro", r.status, await r.text()); process.exit(1); }
fs.writeFileSync(saida, Buffer.from(await r.arrayBuffer()));
console.log("gerado", saida, "| créditos:", r.headers.get("character-cost") ?? "?");
