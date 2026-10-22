@echo off
REM Thin wrapper: delegates to scripts\package-release.ps1 — see docs\library\RELEASE_LOCAL.md
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package-release.ps1" %*
exit /b %ERRORLEVEL%
