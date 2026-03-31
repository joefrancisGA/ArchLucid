@echo off
REM Full release smoke (build, tests, optional UI, API+CLI E2E). Optional: -RunPlaywright for UI E2E. See docs/RELEASE_SMOKE.md
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release-smoke.ps1" %*
exit /b %ERRORLEVEL%
