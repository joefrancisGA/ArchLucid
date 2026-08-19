@echo off
REM Live UI-SQL parity profile (delegates to release-smoke.ps1 -Profile LiveUiSql). Docs: docs\library\RELEASE_SMOKE.md
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release-smoke-live-ui-sql.ps1" %*
exit /b %ERRORLEVEL%
