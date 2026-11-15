@echo off
rem Clique duas vezes neste arquivo para instalar o historias-pov no Windows.
rem O instalador e lido como UTF-8 (acentos certos) e recebe a pasta onde estao os arquivos.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:HPOV_ORIGEM='%~dp0'; iex ([IO.File]::ReadAllText('%~dp0instalar.ps1', [Text.Encoding]::UTF8))"
pause
