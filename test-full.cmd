@echo off
setlocal
cd /d "%~dp0"
REM 54R — Full solution regression (all test projects). See docs/TEST_EXECUTION_MODEL.md
dotnet test ArchiForge.sln
exit /b %ERRORLEVEL%
