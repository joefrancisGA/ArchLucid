@echo off
setlocal
cd /d "%~dp0"
REM Publish API to artifacts\release\api; optional UI production build when Node is on PATH. See docs/RELEASE_LOCAL.md
call "%~dp0build-release.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
if not exist "%~dp0artifacts\release\api" mkdir "%~dp0artifacts\release\api"
dotnet publish "%~dp0ArchiForge.Api\ArchiForge.Api.csproj" -c Release -o "%~dp0artifacts\release\api" --no-build
if errorlevel 1 exit /b %ERRORLEVEL%
where node >nul 2>&1
if errorlevel 1 goto :AfterUi
call :BuildUi
if errorlevel 1 exit /b %ERRORLEVEL%
:AfterUi
REM Emit release metadata.json via PowerShell (available on all supported platforms)
powershell -NoProfile -Command ^
  "$commitSha = 'unknown'; try { $commitSha = git rev-parse HEAD 2>$null; if ([string]::IsNullOrWhiteSpace($commitSha)) { $commitSha = 'unknown' } } catch { }; " ^
  "$meta = [ordered]@{ application='ArchiForge.Api'; commitSha=$commitSha; buildTimestampUtc=(Get-Date).ToUniversalTime().ToString('o'); dotnetSdkVersion=(dotnet --version 2>$null) ?? 'unknown'; packagerHost=$env:COMPUTERNAME ?? $env:HOSTNAME ?? 'unknown' }; " ^
  "$meta | ConvertTo-Json -Depth 4 | Set-Content -Path '%~dp0artifacts\release\metadata.json' -Encoding utf8"
echo Release metadata: %~dp0artifacts\release\metadata.json
echo Release package: API published to %~dp0artifacts\release\api
echo See docs\RELEASE_LOCAL.md for run instructions.
exit /b 0

:BuildUi
pushd "%~dp0archiforge-ui"
call npm ci
if errorlevel 1 goto :UiFail
call npm run build
if errorlevel 1 goto :UiFail
popd
exit /b 0

:UiFail
popd
exit /b %ERRORLEVEL%
