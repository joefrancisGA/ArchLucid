<#
.SYNOPSIS
    One-command production-like onboarding preflight (T2-2).

.DESCRIPTION
    Wraps `archlucid onboard-preflight` — config lint, auth/SQL sanity, and API readiness probes.

.EXAMPLE
    ./scripts/Invoke-OnboardPreflight.ps1

.EXAMPLE
    ./scripts/Invoke-OnboardPreflight.ps1 -ApiBaseUrl http://localhost:5128 -LocalLab
#>
[CmdletBinding()]
param(
    [string] $ApiBaseUrl,
    [switch] $LocalLab,
    [switch] $Json
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$cliProject = Join-Path $repoRoot 'ArchLucid.Cli\ArchLucid.Cli.csproj'

if (-not (Test-Path -LiteralPath $cliProject)) {
    throw "CLI project not found: $cliProject"
}

$args = @('run', '--project', $cliProject, '--', 'onboard-preflight')

if ($ApiBaseUrl) {
    $args += @('--api-base-url', $ApiBaseUrl)
}

if ($LocalLab) {
    $args += '--local-lab'
}

if ($Json) {
    $args += '--json'
}

& dotnet @args
exit $LASTEXITCODE
