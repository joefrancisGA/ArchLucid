@echo off
setlocal
cd /d "%~dp0archlucid-ui"
REM 54R — Vitest unit tests (operator shell). See docs/TEST_EXECUTION_MODEL.md
call npm ci
if errorlevel 1 exit /b %ERRORLEVEL%
call npm run test
exit /b %ERRORLEVEL%
