@echo off
setlocal
cd /d "%~dp0"
REM Release configuration build (whole solution). See docs/RELEASE_LOCAL.md
dotnet restore ArchLucid.sln
if errorlevel 1 exit /b %ERRORLEVEL%
dotnet build ArchLucid.sln -c Release --nologo
exit /b %ERRORLEVEL%
