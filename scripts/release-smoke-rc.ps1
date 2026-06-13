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

    [Parameter(Mandatory = $true)]
    [string] $ResultOut
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

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
