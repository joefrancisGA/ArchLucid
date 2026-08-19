#Requires -Version 7.0
<#
.SYNOPSIS
  Verifies ArchLucid SQL migration script inventory and canonical DDL source boundaries.

.DESCRIPTION
  Lightweight migration verification for release evidence — checks canonical script presence,
  migration inventory counts, and DDL drift via scripts/ci/verify_sql_ddl_sources.py.
  Does not connect to SQL.
#>
[CmdletBinding()]
param(
    [string] $RepoRoot = '',
    [string] $JsonOut = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$scriptPath = Join-Path $RepoRoot 'ArchLucid.Persistence\Scripts\ArchLucid.sql'
$migrationsPath = Join-Path $RepoRoot 'ArchLucid.Persistence\Migrations'
$ddlGuardScript = Join-Path $RepoRoot 'scripts\ci\verify_sql_ddl_sources.py'

if (-not (Test-Path -LiteralPath $scriptPath)) {
    Write-Error "Missing canonical SQL script: $scriptPath"
}

$migrationFiles = @()

if (Test-Path -LiteralPath $migrationsPath) {
    $migrationFiles = @(Get-ChildItem -LiteralPath $migrationsPath -Filter '*.sql' -Recurse -File)
}

$ddlGuardExitCode = 0
$ddlGuardErrors = @()

if (Test-Path -LiteralPath $ddlGuardScript) {
    $ddlOutput = python $ddlGuardScript --repo-root $RepoRoot 2>&1
    $ddlGuardExitCode = $LASTEXITCODE

    if ($ddlGuardExitCode -ne 0) {
        $ddlGuardErrors = @($ddlOutput | ForEach-Object { "$_" })
    }
}
else {
    $ddlGuardExitCode = 1
    $ddlGuardErrors = @("Missing DDL guard script: $ddlGuardScript")
}

$payload = [ordered]@{
    schema = 'archlucid.migration-verification.v1'
    generatedUtc = (Get-Date).ToUniversalTime().ToString('o')
    canonicalScriptPresent = $true
    canonicalScriptPath = 'ArchLucid.Persistence/Scripts/ArchLucid.sql'
    incrementalMigrationCount = $migrationFiles.Count
    ddlSourceGuardPassed = ($ddlGuardExitCode -eq 0)
    ddlSourceGuardErrors = $ddlGuardErrors
    disposition = if ($migrationFiles.Count -gt 0 -and $ddlGuardExitCode -eq 0) { 'PASS' } else { 'HOLD' }
}

$json = $payload | ConvertTo-Json -Depth 6

if (-not [string]::IsNullOrWhiteSpace($JsonOut)) {
    $dir = Split-Path -Parent $JsonOut

    if (-not [string]::IsNullOrWhiteSpace($dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    Set-Content -LiteralPath $JsonOut -Value $json -Encoding utf8NoBOM
}

Write-Output $json

if ($payload.disposition -eq 'HOLD') {
    exit 2
}

exit 0
