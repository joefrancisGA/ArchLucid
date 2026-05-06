@echo off
REM Full release smoke (build, tests, optional UI, API+CLI E2E). Optional: RunPlaywright, LivePlaywright, or -Profile LiveUiSql. Docs: docs\library\RELEASE_SMOKE.md
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release-smoke.ps1" %*
exit /b %ERRORLEVEL%
