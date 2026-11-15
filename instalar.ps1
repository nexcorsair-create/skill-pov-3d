# Instalador do historias-pov para Windows.
# Uso (PowerShell):  irm https://raw.githubusercontent.com/nexcorsair-create/skill-pov-3d/main/instalar.ps1 | iex
#   ou, na pasta baixada:  powershell -ExecutionPolicy Bypass -File instalar.ps1
# Opções (só quando roda o arquivo): -Pasta <pasta de trabalho> -ComEarshot -Sim (não pergunta) -SemTeste
#   (pelo comando de uma linha, use variáveis antes:  $env:HPOV_PASTA="D:\Videos"; $env:HPOV_EARSHOT="1")
# O que faz: instala o que falta (Node.js, ffmpeg, Python, faster-whisper), copia a skill para o Claude,
# cria a pasta de trabalho com o estúdio e faz um teste. Não pede nem guarda nenhuma chave.
param(
  [string]$Pasta = $(if ($env:HPOV_PASTA) { $env:HPOV_PASTA } else { Join-Path $HOME "HistoriasPOV" }),
  [string]$PastaSkills = $(if ($env:HPOV_SKILLS) { $env:HPOV_SKILLS } else { Join-Path $HOME ".claude\skills" }),
  [string]$Repo = $(if ($env:HPOV_REPO) { $env:HPOV_REPO } else { "nexcorsair-create/skill-pov-3d" }),
  [string]$Origem = "",
  [switch]$ComEarshot = [bool]$env:HPOV_EARSHOT,
  [switch]$Sim = [bool]$env:HPOV_SIM,
  [switch]$SemTeste = [bool]$env:HPOV_SEMTESTE
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
function Passo($t) { Write-Host ""; Write-Host "==> $t" -ForegroundColor Cyan }
function Ok($t) { Write-Host "    ok: $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "    atenção: $t" -ForegroundColor Yellow }
function Falha($t) { Write-Host ""; Write-Host "ERRO: $t" -ForegroundColor Red; Write-Host "Nada foi apagado. Veja 'Quando algo dá errado' no guia PDF ou no README."; exit 1 }
function Atualiza-Path { $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") }
function Tem($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

# ---------- 1. o que já existe ----------
Passo "Conferindo o que já está instalado"
$falta = @()
$nodeOk = $false
if (Tem "node") { $v = (node -v) -replace "v", ""; if ([int]($v.Split(".")[0]) -ge 20) { $nodeOk = $true; Ok "Node.js $v" } }
if (-not $nodeOk) { $falta += @{ nome = "Node.js (LTS)"; id = "OpenJS.NodeJS.LTS" } }
if (Tem "ffmpeg") { Ok "ffmpeg" } else { $falta += @{ nome = "ffmpeg"; id = "Gyan.FFmpeg" } }
function Acha-Python {
  foreach ($cand in @("py -3", "python", "python3")) {
    $c = $cand.Split(" ")
    if (Tem $c[0]) {
      try { $v = & $c[0] @($c | Select-Object -Skip 1) -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null } catch { continue }
      if ($v -match "^3\.(\d+)$" -and [int]$Matches[1] -ge 10) { return $cand }
    }
  }
  return $null
}
function Py { $c = $script:py.Split(" "); & $c[0] @($c | Select-Object -Skip 1) @args }
$py = Acha-Python
if ($py) { Ok ("Python " + (Py --version)) } else { $falta += @{ nome = "Python 3.12"; id = "Python.Python.3.12" } }
if ($ComEarshot -and -not (Tem "git")) { $falta += @{ nome = "Git"; id = "Git.Git" } }
if ($falta.Count -gt 0 -and -not (Tem "winget")) { Falha "o winget (instalador do Windows) não foi encontrado. Instale o 'Instalador de Aplicativo' pela Microsoft Store e rode de novo." }

# ---------- 2. a única pergunta ----------
Write-Host ""
Write-Host "Vou fazer o seguinte:" -ForegroundColor White
foreach ($f in $falta) { Write-Host "  - instalar $($f.nome) (pelo winget, programa oficial)" }
Write-Host "  - instalar o faster-whisper (transcrição de voz, grátis; baixa ~1,6 GB na primeira transcrição)"
if ($ComEarshot) { Write-Host "  - instalar o Earshot em $HOME\tools\earshot (~2 GB)" }
Write-Host "  - copiar a skill 'historia-pov' para $PastaSkills"
Write-Host "  - criar a pasta de trabalho $Pasta (estúdio + histórias) e instalar o estúdio (~400 MB)"
if (-not $SemTeste) { Write-Host "  - fazer um teste rápido (um quadro do vídeo de exemplo)" }
Write-Host "Nenhuma chave é pedida ou guardada. Leva de 5 a 20 minutos, conforme a internet."
if (-not $Sim) {
  $r = Read-Host "Confirma a instalação? [S/n]"
  if ($r -and $r.Trim().ToLower() -notin @("s", "sim", "y", "yes")) { Write-Host "Instalação cancelada. Nada foi alterado."; exit 0 }
}

# ---------- 3. programas ----------
foreach ($f in $falta) {
  Passo "Instalando $($f.nome)"
  winget install -e --id $f.id --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) { Falha "o winget não conseguiu instalar $($f.nome) (código $LASTEXITCODE)." }
  Atualiza-Path
}
if (-not (Tem "node")) { Falha "o Node.js foi instalado, mas o Windows ainda não o encontra. Feche esta janela, abra outra e rode o instalador de novo." }
if (-not (Tem "ffmpeg")) { Falha "o ffmpeg foi instalado, mas o Windows ainda não o encontra. Feche esta janela, abra outra e rode o instalador de novo." }
$py = Acha-Python
if (-not $py) { Falha "o Python foi instalado, mas o Windows ainda não o encontra. Feche esta janela, abra outra e rode o instalador de novo." }

# ---------- 4. arquivos do pacote ----------
Passo "Pegando os arquivos do pacote"
if (-not $Origem) {
  if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "skill\historia-pov\SKILL.md"))) { $Origem = $PSScriptRoot }
  else {
    if ($Repo -like "SEU-USUARIO*") { Falha "este instalador ainda não sabe de onde baixar (endereço do repositório não definido). Baixe a pasta do pacote e rode o instalar.ps1 de dentro dela." }
    $zip = Join-Path $env:TEMP "historias-pov.zip"; $dest = Join-Path $env:TEMP "historias-pov-src"
    Invoke-WebRequest "https://github.com/$Repo/archive/refs/heads/main.zip" -OutFile $zip
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Expand-Archive $zip $dest; $Origem = (Get-ChildItem $dest -Directory | Select-Object -First 1).FullName
  }
}
$skillSrc = Join-Path $Origem "skill\historia-pov"
if (-not (Test-Path (Join-Path $skillSrc "SKILL.md"))) { Falha "não achei a skill em $skillSrc." }
Ok "arquivos em $Origem"

# ---------- 5. a skill ----------
Passo "Copiando a skill para o Claude"
New-Item -ItemType Directory -Force $PastaSkills | Out-Null
$skillDest = Join-Path $PastaSkills "historia-pov"
if (Test-Path $skillDest) {
  $bk = "$skillDest.antiga-" + (Get-Date -Format "yyyyMMdd-HHmmss"); Move-Item $skillDest $bk; Aviso "a skill antiga foi guardada em $bk"
}
Copy-Item $skillSrc $skillDest -Recurse
Ok $skillDest

# ---------- 6. pasta de trabalho ----------
Passo "Criando a pasta de trabalho"
$estudio = Join-Path $Pasta "estudio"
New-Item -ItemType Directory -Force (Join-Path $Pasta "historias") | Out-Null
$codigo = Join-Path $skillSrc "codigo\estudio"
if (-not (Test-Path $estudio)) { Copy-Item $codigo $estudio -Recurse; Ok "estúdio novo em $estudio" }
else {
  # atualização: troca só as peças do pacote; não mexe em .env.local, nas histórias nem no Root.tsx
  foreach ($p in @("src\kit", "src\exemplo", "scripts")) { Copy-Item (Join-Path $codigo "$p\*") (Join-Path $estudio $p) -Recurse -Force }
  foreach ($p in @("package.json", "tsconfig.json", ".env.example")) { Copy-Item (Join-Path $codigo $p) (Join-Path $estudio $p) -Force }
  Aviso "o estúdio já existia: atualizei só as peças do pacote (kit, exemplo, scripts). Suas histórias e sua chave não foram tocadas."
}
if (-not (Test-Path (Join-Path $Pasta "CLAUDE.md"))) { Copy-Item (Join-Path $skillSrc "codigo\CLAUDE.md") (Join-Path $Pasta "CLAUDE.md") }

Passo "Instalando o estúdio (Remotion + three.js)"
Push-Location $estudio
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Pop-Location; Falha "o 'npm install' falhou. Confira a internet e rode o instalador de novo." }
Pop-Location
Ok "estúdio instalado"

Passo "Preparando o navegador interno do Remotion (~100 MB, só na primeira vez)"
Push-Location $estudio
node scripts/preparar_navegador.mjs
$okNav = ($LASTEXITCODE -eq 0)
Pop-Location
if ($okNav) { Ok "navegador interno" } else { Aviso "o navegador interno não ficou pronto; o teste pode falhar. Peça ajuda ao Claude mostrando a mensagem acima." }

# ---------- 7. Python ----------
Passo "Instalando o faster-whisper e as bibliotecas de som"
Py -m pip install --user --upgrade --disable-pip-version-check faster-whisper numpy pillow
if ($LASTEXITCODE -ne 0) { Falha "o pip não conseguiu instalar o faster-whisper." }
Ok "faster-whisper"

# ---------- 8. Earshot (opcional) ----------
if ($ComEarshot) {
  Passo "Instalando o Earshot (opcional)"
  $es = Join-Path $HOME "tools\earshot"
  if (-not (Test-Path $es)) { git clone https://github.com/Leonxlnx/earshot $es }
  Push-Location $es
  Py -m venv .venv
  .\.venv\Scripts\python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
  .\.venv\Scripts\python -m pip install -e ".[mcp]"
  .\.venv\Scripts\earshot doctor
  Pop-Location
  Ok "Earshot em $es (comando: $es\.venv\Scripts\earshot.exe)"
}

# ---------- 9. teste ----------
if (-not $SemTeste) {
  Passo "Teste rápido: um quadro do vídeo de exemplo"
  Push-Location $estudio
  node scripts/quadros.mjs Exemplo out/teste/exemplo- 300 0.4
  $okTeste = Test-Path "out\teste\exemplo-0300.jpg"
  Pop-Location
  if ($okTeste) { Ok "o 3D funciona: $estudio\out\teste\exemplo-0300.jpg" } else { Aviso "o teste não gerou a imagem. O resto foi instalado; peça ajuda ao Claude mostrando a mensagem acima." }
}

Write-Host ""
Write-Host "PRONTO!" -ForegroundColor Green
Write-Host "1. Abra o Claude (Claude Code) na pasta: $Pasta"
Write-Host "2. Peça: monta uma história"
Write-Host "3. A chave da ElevenLabs só é necessária na etapa das vozes; o Claude explica como criar o arquivo .env.local sozinho."
