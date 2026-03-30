@echo off
setlocal
cd /d "%~dp0"
REM 54R — HTTP / host integration tests (Category=Integration). See docs/TEST_EXECUTION_MODEL.md
dotnet test ArchiForge.sln --filter "Category=Integration"
exit /b %ERRORLEVEL%
