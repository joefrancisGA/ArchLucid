@echo off
setlocal
cd /d "%~dp0"
REM Core tier: Suite=Core. See docs/TEST_EXECUTION_MODEL.md
dotnet test ArchLucid.sln --filter "Suite=Core"
exit /b %ERRORLEVEL%
