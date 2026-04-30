<#
    .SYNOPSIS
        Single entry point for every ArchLucid local test tier.

    .DESCRIPTION
        Replaces the eight legacy ``test-<tier>.ps1`` scripts with one
        parameterised driver. Pick a tier with ``-Tier <name>``; the
        underlying ``dotnet test`` (or ``npm`` for UI tiers) command is
        documented in the per-tier help in ``docs/TEST_EXECUTION_MODEL.md``.

        The legacy ``test-<tier>.ps1`` scripts continue to work but now
        delegate here, so existing runbooks, CI workflows, and operator
        documentation references stay valid during the migration.

    .PARAMETER Tier
        One of:
          Core                 – xUnit Suite=Core (full Core tier)
          FastCore             – same filter as CI corset: Core minus Slow, Integration, GoldenCorpusRecord
          OpenApiContract      – OpenAPI ``/openapi/v1.json`` snapshot (``scripts/ci/check_openapi_contract_snapshot.ps1``; CI gate)
          Full                 – entire ``ArchLucid.sln`` test run
          Integration           – xUnit Category=Integration
          Slow                  – xUnit Category=Slow
          SqlServerIntegration  – xUnit Category=SqlServerContainer (requires
                                  ARCHLUCID_SQL_TEST connection string)
          UiSmoke               – Playwright smoke for ``archlucid-ui``
          UiUnit                – Vitest unit suite for ``archlucid-ui``

    .PARAMETER ListTiers
        Print the supported tier names and exit 0 without running anything.

    .EXAMPLE
        .\test.ps1 -Tier FastCore
        .\test.ps1 -Tier UiSmoke
        .\test.ps1 -ListTiers
#>
[CmdletBinding(DefaultParameterSetName = 'Run')]
param(
    [Parameter(Mandatory = $true, ParameterSetName = 'Run', Position = 0)]
    [ValidateSet(
        'Core',
        'FastCore',
        'OpenApiContract',
        'Full',
        'Integration',
        'Slow',
        'SqlServerIntegration',
        'UiSmoke',
        'UiUnit'
    )]
    [string] $Tier,

    [Parameter(Mandatory = $true, ParameterSetName = 'List')]
    [switch] $ListTiers
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Tier name → human-readable description (printed by -ListTiers and on dispatch).
# Adding a tier = add an entry here AND a case in Invoke-Tier below.
$tierDescriptions = [ordered]@{
    'Core'                 = 'xUnit Suite=Core (full Core tier)'
    'FastCore'             = 'Suite=Core minus Slow, Integration, GoldenCorpusRecord (matches CI corset)'
    'OpenApiContract'      = 'OpenAPI v1 contract snapshot test (scripts/ci/check_openapi_contract_snapshot.ps1)'
    'Full'                 = 'entire ArchLucid.sln test run'
    'Integration'          = 'xUnit Category=Integration'
    'Slow'                 = 'xUnit Category=Slow'
    'SqlServerIntegration' = 'xUnit Category=SqlServerContainer (requires ARCHLUCID_SQL_TEST)'
    'UiSmoke'              = 'Playwright smoke for archlucid-ui'
    'UiUnit'               = 'Vitest unit suite for archlucid-ui'
}

if ($ListTiers) {
    Write-Host 'ArchLucid test tiers:'
    foreach ($entry in $tierDescriptions.GetEnumerator()) {
        Write-Host ('  {0,-22} {1}' -f $entry.Key, $entry.Value)
    }
    exit 0
}

function Invoke-DotnetTest {
    param(
        [string] $Project,
        [string] $Filter
    )

    if ($Filter) {
        & dotnet test $Project --filter $Filter
        return $LASTEXITCODE
    }

    & dotnet test $Project
    return $LASTEXITCODE
}

function Invoke-UiCommand {
    param([string[]] $Steps)

    Set-Location (Join-Path $root 'archlucid-ui')

    # Use .cmd shims on Windows so StrictMode does not load npm.ps1 (breaks on $MyInvocation.Statement).
    $npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }
    $npx = if (Get-Command npx.cmd -ErrorAction SilentlyContinue) { 'npx.cmd' } else { 'npx' }

    foreach ($step in $Steps) {
        switch ($step) {
            'install'           { & $npm ci }
            'playwright-deps'   { & $npx playwright install --with-deps chromium }
            'test:e2e'          { & $npm run test:e2e }
            'test'              { & $npm run test }
            default             { throw "Unknown UI step: $step" }
        }

        if ($LASTEXITCODE -ne 0) { return $LASTEXITCODE }
    }

    return 0
}

function Invoke-Tier {
    param([string] $Selected)

    Write-Host "ArchLucid test driver - running tier: $Selected"
    Write-Host "  $($tierDescriptions[$Selected])"
    Write-Host ''

    switch ($Selected) {
        'Core' {
            return (Invoke-DotnetTest -Project 'ArchLucid.sln' -Filter 'Suite=Core')
        }
        'FastCore' {
            return (Invoke-DotnetTest -Project 'ArchLucid.sln' -Filter 'Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord')
        }
        'OpenApiContract' {
            $script = Join-Path $root 'scripts/ci/check_openapi_contract_snapshot.ps1'
            & $script
            return $LASTEXITCODE
        }
        'Full' {
            return (Invoke-DotnetTest -Project 'ArchLucid.sln' -Filter '')
        }
        'Integration' {
            return (Invoke-DotnetTest -Project 'ArchLucid.sln' -Filter 'Category=Integration')
        }
        'Slow' {
            return (Invoke-DotnetTest -Project 'ArchLucid.sln' -Filter 'Category=Slow')
        }
        'SqlServerIntegration' {
            return (Invoke-DotnetTest -Project 'ArchLucid.Persistence.Tests' -Filter 'Category=SqlServerContainer')
        }
        'UiSmoke' {
            return (Invoke-UiCommand -Steps @('install', 'playwright-deps', 'test:e2e'))
        }
        'UiUnit' {
            return (Invoke-UiCommand -Steps @('install', 'test'))
        }
        default {
            throw ("Unhandled tier '" + $Selected + "' - add a case in Invoke-Tier.")
        }
    }
}

$exit = Invoke-Tier -Selected $Tier
exit $exit
