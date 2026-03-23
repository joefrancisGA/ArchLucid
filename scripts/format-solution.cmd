@echo off
setlocal
cd /d "%~dp0.."
dotnet format ArchiForge.sln %*
exit /b %ERRORLEVEL%
