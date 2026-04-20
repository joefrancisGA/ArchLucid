@echo off
REM ArchLucid test trampoline — forwards to test.ps1.
REM Usage:
REM   test.cmd Core
REM   test.cmd FastCore
REM   test.cmd UiSmoke
REM   test.cmd -ListTiers
REM
REM See docs/TEST_EXECUTION_MODEL.md for tier definitions.
setlocal
cd /d "%~dp0"
if "%~1"=="" (
    echo.
    echo Usage: test.cmd ^<Tier^>   ^|   test.cmd -ListTiers
    echo See docs/TEST_EXECUTION_MODEL.md for the supported tier list.
    exit /b 2
)

if /I "%~1"=="-ListTiers" (
    powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0test.ps1" -ListTiers
    exit /b %ERRORLEVEL%
)

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0test.ps1" -Tier %1
exit /b %ERRORLEVEL%
