<#
    .SYNOPSIS
        Runs production-like hosted-pilot config lint and writes JSON/Markdown proof artifacts.

    .DESCRIPTION
        Reuses the existing ArchLucid CLI lint engine (`archlucid config lint --profile production-like-hosted-pilot`).
        Blocking findings fail the step (exit 1). Advisory findings are printed but do not fail the step.

    .PARAMETER OutputDir
        Directory for config-lint-production-like-hosted-pilot.json and .md artifacts.

    .PARAMETER WorkingDirectory
        Directory containing appsettings.json / archlucid.json overlays for lint evaluation.
        Defaults to fixtures/release-candidate (RC baseline shape).

    .PARAMETER SkipBuild
        When set, assumes ArchLucid.Cli is already built in Release configuration.

    .EXAMPLE
        .\scripts\ci\Invoke-ConfigLintProofStep.ps1 -OutputDir artifacts/release-readiness
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $OutputDir,

    [string] $WorkingDirectory = '',

    [switch] $SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) {
    $WorkingDirectory = Join-Path $repoRoot 'fixtures/release-candidate'
}

if (-not (Test-Path -LiteralPath $WorkingDirectory)) {
    Write-Error "Config lint working directory not found: $WorkingDirectory"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

[string] $jsonPath = Join-Path $OutputDir 'config-lint-production-like-hosted-pilot.json'
[string] $markdownPath = Join-Path $OutputDir 'config-lint-production-like-hosted-pilot.md'
[string] $cliProject = Join-Path $repoRoot 'ArchLucid.Cli\ArchLucid.Cli.csproj'

if (-not $SkipBuild) {
    dotnet build $cliProject -c Release --nologo -v q

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

[string[]] $lintArgs = @(
    'run',
    '--project', $cliProject,
    '-c', 'Release',
    '--no-build',
    '--',
    'config',
    'lint',
    '--profile', 'production-like-hosted-pilot',
    '--json-out', $jsonPath,
    '--markdown-out', $markdownPath
)

Push-Location -LiteralPath $WorkingDirectory
try {
    & dotnet @lintArgs
    [int] $lintExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $jsonPath)) {
    Write-Host "Config lint failed: no JSON artifact written (exit $lintExit)." -ForegroundColor Red
    exit 1
}

$lintDoc = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
[int] $blockingCount = @($lintDoc.blockingFindings).Count
[int] $advisoryCount = @($lintDoc.advisoryFindings).Count
[string] $disposition = [string]$lintDoc.proofDisposition

if ([string]::IsNullOrWhiteSpace($disposition)) {
    $disposition = if ($lintDoc.ok) { 'READY' } else { 'HOLD' }
}

Write-Host "Config lint disposition: $disposition (blocking=$blockingCount, advisory=$advisoryCount)" -ForegroundColor Cyan
Write-Host "  JSON:     $jsonPath"
Write-Host "  Markdown: $markdownPath"

if ($advisoryCount -gt 0) {
    Write-Host "Advisory findings (non-blocking):" -ForegroundColor DarkYellow

    foreach ($finding in $lintDoc.advisoryFindings) {
        Write-Host "  [$($finding.ruleName)] $($finding.message)"
    }
}

if ($blockingCount -gt 0) {
    Write-Host "Blocking findings:" -ForegroundColor Red

    foreach ($finding in $lintDoc.blockingFindings) {
        Write-Host "  [$($finding.ruleName)] $($finding.message)"
    }

    exit 1
}

exit 0
