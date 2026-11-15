// PREPARA O NAVEGADOR INTERNO do Remotion (o "Chrome Headless Shell", ~100 MB, usado para gerar os quadros).
// Por que existe: em alguns computadores (visto com o Node 26 no Windows) o Remotion baixa o navegador mas não
// descompacta tudo, e o primeiro render fica parado para sempre, sem mensagem de erro. Este script baixa (se faltar),
// confere se o programa do navegador está lá e, se não estiver, descompacta o arquivo à mão.
// O instalador roda isto sozinho. Rode à mão se um render ou quadro de teste travar logo no começo:
//   node scripts/preparar_navegador.mjs        (na pasta estudio/)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const base = path.resolve("node_modules/.remotion/chrome-headless-shell");
const temPrograma = () => {
  if (!fs.existsSync(base)) return false;
  const procura = (d, n = 0) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return true;
      if (e.isDirectory() && n < 3 && procura(p, n + 1)) return true;
    }
    return false;
  };
  return procura(base);
};
const zips = () => (fs.existsSync(base) ? fs.readdirSync(base).filter((f) => /^chrome-headless-shell-.+\.zip$/.test(f)) : []);

if (temPrograma()) { console.log("Navegador interno pronto."); process.exit(0); }

if (!zips().length) {
  console.log("Baixando o navegador interno do Remotion (~100 MB, só na primeira vez)...");
  spawnSync("npx", ["remotion", "browser", "ensure"], { stdio: "inherit", shell: true, timeout: 15 * 60 * 1000 });
  if (temPrograma()) { console.log("Navegador interno pronto."); process.exit(0); }
}

for (const z of zips()) {
  const plataforma = z.replace(/^chrome-headless-shell-/, "").replace(/\.zip$/, ""); // win64, mac-arm64, mac-x64, linux64
  const destino = path.join(base, plataforma);
  fs.mkdirSync(destino, { recursive: true });
  console.log(`Descompactando ${z} em ${destino}...`);
  // tar do Windows 10+ e do Mac abrem .zip; no Linux, unzip
  let r = spawnSync("tar", ["-xf", path.join(base, z), "-C", destino], { stdio: "inherit" });
  if (r.status !== 0) r = spawnSync("unzip", ["-o", "-q", path.join(base, z), "-d", destino], { stdio: "inherit" });
}
if (temPrograma()) { console.log("Navegador interno pronto."); process.exit(0); }
console.error("Não consegui preparar o navegador interno. Rode 'npx remotion browser ensure' e veja a mensagem de erro.");
process.exit(1);
