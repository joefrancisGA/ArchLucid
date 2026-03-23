# Apply EditorConfig / Roslyn formatting to the whole solution.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
dotnet format ArchiForge.sln @args
exit $LASTEXITCODE
