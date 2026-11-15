// VARREDURA DE SEGREDOS: procura chaves, tokens, senhas, arquivos .env, dados pessoais e arquivos pesados
// em tudo o que iria para o GitHub. Roda sozinha antes de cada commit (trava em .githooks/pre-commit)
// e pode ser rodada à mão:  node ferramentas/varrer_segredos.mjs
// Sai com erro (e o commit é bloqueado) se achar qualquer coisa. Nunca mostra o segredo inteiro na tela.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IGNORAR_PASTAS = new Set([".git", "node_modules", "out", ".venv", "__pycache__", "historias", "_fonte-guia"]);
const PESADO_MB = 5;

// lista o que iria para o commit: pelo git (respeita o .gitignore) ou, sem git, andando nas pastas
function arquivos() {
  try {
    const s = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return s.split("\0").filter(Boolean).filter((f) => fs.existsSync(path.join(raiz, f)));
  } catch {
    const out = [];
    const anda = (d) => { for (const e of fs.readdirSync(path.join(raiz, d), { withFileTypes: true })) { const r = path.posix.join(d, e.name); if (e.isDirectory()) { if (!IGNORAR_PASTAS.has(e.name)) anda(r); } else out.push(r); } };
    anda("."); return out.map((f) => f.replace(/^\.\//, ""));
  }
}

const REGRAS = [
  ["chave da ElevenLabs", /\bsk_[a-f0-9]{40,}\b/i],
  ["chave tipo OpenAI/Anthropic", /\bsk-(ant-)?[A-Za-z0-9_-]{20,}/],
  ["token do GitHub", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
  ["chave do Google", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["chave da AWS", /\bAKIA[0-9A-Z]{16}\b/],
  ["token do Slack", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["variável de chave preenchida", /\b[A-Z0-9_]*(API_KEY|SECRET|TOKEN|PASSWORD|SENHA)[A-Z0-9_]*\s*=\s*["']?[A-Za-z0-9_\-\/+]{12,}/],
  ["cabeçalho com chave", /xi-api-key["']?\s*[:=]\s*["'][A-Za-z0-9]{20,}/i],
  ["caminho pessoal do Windows", /[A-Za-z]:\\Users\\(?!Public\\|<|SEU)[^\\\s"'<>]+/],
  ["caminho pessoal do Mac", /\/Users\/(?!Shared\/|<|SEU|\$)[A-Za-z0-9._-]+\//],
  ["e-mail", /\b[A-Za-z0-9._%+-]+@(?!example\.|exemplo\.|users\.noreply\.github\.com|anthropic\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
];
const ACEITOS = [/noreply@anthropic\.com/];
const BINARIO = /\.(jpg|jpeg|png|gif|webp|ico|pdf|zip|woff2?|ttf|otf|glb|gltf|bin)$/i;

const achados = [];
for (const f of arquivos()) {
  const abs = path.join(raiz, f), nome = path.basename(f);
  if (nome.startsWith(".env") && nome !== ".env.example") achados.push([f, "arquivo .env (pode ter a chave)", ""]);
  if (nome === ".env.example") { const t = fs.readFileSync(abs, "utf8"); if (/=\s*\S{8,}/.test(t.replace(/^#.*$/gm, ""))) achados.push([f, ".env.example com valor preenchido", ""]); }
  const mb = fs.statSync(abs).size / 1e6;
  if (mb > PESADO_MB) achados.push([f, `arquivo pesado (${mb.toFixed(1)} MB)`, ""]);
  if (/\.(mp3|wav|mp4|mov|m4a|flac|ogg|aiff|webm|mkv)$/i.test(f)) achados.push([f, "áudio ou vídeo (não deve subir)", ""]);
  if (BINARIO.test(f) || mb > PESADO_MB) continue;
  const linhas = fs.readFileSync(abs, "utf8").split(/\r?\n/);
  linhas.forEach((l, i) => {
    for (const [tipo, re] of REGRAS) {
      const m = l.match(re);
      if (m && !ACEITOS.some((a) => a.test(l))) { const v = m[0]; achados.push([`${f}:${i + 1}`, tipo, v.length > 10 ? v.slice(0, 6) + "…" + "(escondido)" : v]); }
    }
  });
}

if (achados.length) {
  console.log(`\nVARREDURA DE SEGREDOS: ${achados.length} problema(s). Nada deve subir até corrigir:\n`);
  for (const [onde, tipo, trecho] of achados) console.log(`  ${onde}  ->  ${tipo}${trecho ? "  [" + trecho + "]" : ""}`);
  console.log("\nSe for uma chave real que já foi exposta: apague-a no site e crie outra.");
  process.exit(1);
}
console.log(`Varredura de segredos limpa: ${arquivos().length} arquivos conferidos, nenhuma chave, token, .env, dado pessoal ou arquivo pesado.`);
