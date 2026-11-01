@echo off
setlocal
cd /d "%~dp0"
set "GAME_NODE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined GAME_NODE set "GAME_NODE=%%I"
if not defined GAME_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "GAME_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined GAME_NODE (
  echo Node.js wurde nicht gefunden. Alternativ Nachtschicht.html im Browser oeffnen.
  pause
  exit /b 1
)
if /i "%~1"=="--check" (
  "%GAME_NODE%" --version
  exit /b
)
echo Nachtschicht wird gestartet. Auf die Meldung Local: warten.
echo Dieses Fenster offen lassen. Mit Strg+C beenden.
"%GAME_NODE%" scripts/serve.cjs
pause
