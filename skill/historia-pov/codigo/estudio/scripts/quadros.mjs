// QUADROS DE TESTE: tira alguns quadros parados de um vídeo, sem renderizar tudo (1 minuto em vez de 30).
// Use antes de todo render completo, principalmente nos momentos com texto na tela.
// uso (na pasta estudio/): node scripts/quadros.mjs <composição> <prefixo-de-saída> <quadro,quadro,...> [escala 0.5]
//   ex.: node scripts/quadros.mjs Exemplo out/teste/ex- 0,60,150,250,330,400 0.5
import fs from "node:fs";
import path from "node:path";
const tmp = path.resolve("out/remotion-tmp"); fs.mkdirSync(tmp, { recursive: true }); process.env.TMPDIR = tmp; process.env.TEMP = tmp; process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");
const [id, prefixo, quadros, escala = "0.5"] = process.argv.slice(2);
if (!id || !prefixo || !quadros) { console.error("uso: node scripts/quadros.mjs <composição> <prefixo> <quadro,quadro,...> [escala]"); process.exit(1); }
fs.mkdirSync(path.dirname(path.resolve(prefixo)), { recursive: true });
const chromiumOptions = { gl: "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error") console.log("[erro no navegador]", l.text.slice(0, 300)); };
for (const f of quadros.split(",").map(Number)) {
  const t0 = Date.now(), saida = `${prefixo}${String(f).padStart(4, "0")}.jpg`;
  await renderStill({ composition, serveUrl, frame: f, output: saida, imageFormat: "jpeg", jpegQuality: 88, scale: Number(escala), chromiumOptions, timeoutInMilliseconds: 180000, onBrowserLog });
  console.log("quadro", f, "->", saida, ((Date.now() - t0) / 1000).toFixed(1) + " s");
}
process.exit(0);
