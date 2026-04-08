@echo off
setlocal
cd /d "%~dp0"
REM Publish API to artifacts\release\api; optional UI production build when Node is on PATH. See docs/RELEASE_LOCAL.md
call "%~dp0build-release.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
if not exist "%~dp0artifacts\release\api" mkdir "%~dp0artifacts\release\api"
dotnet publish "%~dp0ArchiForge.Api\ArchiForge.Api.csproj" -c Release -o "%~dp0artifacts\release\api" --no-build
if errorlevel 1 exit /b %ERRORLEVEL%
set "ARCHIFORGE_PKG_UI_INCLUDED=0"
where node >nul 2>&1
if errorlevel 1 goto :AfterUi
call :BuildUi
if errorlevel 1 exit /b %ERRORLEVEL%
:AfterUi
if "%ARCHIFORGE_PKG_UI_INCLUDED%"=="1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Write-ReleasePackageArtifacts.ps1" -RepoRoot "%~dp0" -ApiPublishDirectory "%~dp0artifacts\release\api" -UiProductionBuildIncluded
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Write-ReleasePackageArtifacts.ps1" -RepoRoot "%~dp0" -ApiPublishDirectory "%~dp0artifacts\release\api"
)
if errorlevel 1 exit /b %ERRORLEVEL%
echo.
echo Release package: API published to %~dp0artifacts\release\api
echo Handoff summary: %~dp0artifacts\release\PACKAGE-HANDOFF.txt
echo See docs\RELEASE_LOCAL.md for run instructions.
exit /b 0

:BuildUi
pushd "%~dp0archlucid-ui"
call npm ci
if errorlevel 1 goto :UiFail
call npm run build
if errorlevel 1 goto :UiFail
popd
set "ARCHIFORGE_PKG_UI_INCLUDED=1"
exit /b 0

:UiFail
popd
exit /b %ERRORLEVEL%
