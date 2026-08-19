# Release candidate profile: live UI vs SQL parity + mandatory machine-readable result artifact.
# See docs/library/RELEASE_SMOKE.md — "Named live UI-SQL parity profile" and ReleaseCandidate alias.

param(
    [string] $SqlConnectionString = '',
    [Alias('BaseUrl')]
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipE2E,
    [switch] $SkipUi,
    [switch] $FullCore,
    [switch] $RunPlaywright,

    [string] $BearerToken = '',

    [string] $ApiKey = '',

    [string] $ResultOut = 'artifacts/release-smoke-live-ui-sql-result.json'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

. (Join-Path $scriptPath 'OperatorDiagnostics.ps1')

if ($SkipE2E.IsPresent) {
    Write-OperatorFailureTriage -Stage 'Release candidate preflight' -Category 'StrictRcValidation' `
        -Details @(
        'Release candidate profile is fail-closed: -SkipE2E produces Partial evidence only and cannot satisfy RC signoff lanes.'
    ) `
        -NextSteps @(
        'Omit -SkipE2E and supply tenant SQL (ARCHLUCID_SMOKE_SQL or -SqlConnectionString)',
        'Use plain release-smoke.ps1 -SkipE2E for build-only developer workflows',
        'See docs/library/RELEASE_SMOKE.md — ReleaseCandidate profile'
    )
    exit 1
}

if ($SkipUi.IsPresent) {
    Write-OperatorFailureTriage -Stage 'Release candidate preflight' -Category 'StrictRcValidation' `
        -Details @(
        'Release candidate profile requires UI Vitest + production build for live UI↔SQL parity evidence.'
    ) `
        -NextSteps @(
        'Omit -SkipUi for RC signoff',
        'Use plain release-smoke.ps1 -SkipUi when UI build is intentionally skipped',
        'See docs/library/RELEASE_SMOKE.md — ReleaseCandidate profile'
    )
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ResultOut)) {
    Write-Error 'Release candidate profile requires -ResultOut for machine-readable strict evidence (default: artifacts/release-smoke-live-ui-sql-result.json).'
    exit 1
}

$env:ARCHLUCID_RC_RELEASE_CONTEXT = '1'

& (Join-Path $scriptPath 'release-smoke.ps1') -Profile ReleaseCandidate `
    -SqlConnectionString $SqlConnectionString `
    -ApiBaseUrl $ApiBaseUrl `
    -SkipE2E:$SkipE2E `
    -SkipUi:$SkipUi `
    -FullCore:$FullCore `
    -RunPlaywright:$RunPlaywright `
    -LivePlaywright:$false `
    -BearerToken $BearerToken `
    -ApiKey $ApiKey `
    -ResultOut $ResultOut

exit $LASTEXITCODE
