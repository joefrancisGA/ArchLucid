@echo off
setlocal
cd /d "%~dp0archiforge-ui"
REM 54R — Playwright smoke for operator shell. See docs/TEST_EXECUTION_MODEL.md
call npm ci
if errorlevel 1 exit /b %ERRORLEVEL%
call npx playwright install chromium
if errorlevel 1 exit /b %ERRORLEVEL%
call npm run test:e2e
exit /b %ERRORLEVEL%
