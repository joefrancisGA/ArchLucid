@echo off
setlocal
cd /d "%~dp0"
REM 54R — Core / corset suite (Suite=Core). See docs/TEST_EXECUTION_MODEL.md
dotnet test ArchiForge.sln --filter "Suite=Core"
exit /b %ERRORLEVEL%
