@echo off
setlocal
cd /d "%~dp0.."
dotnet format ArchLucid.sln %*
exit /b %ERRORLEVEL%
