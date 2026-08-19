#requires -Version 5.1
<#
.SYNOPSIS
  Thin wrapper mapping the seven-step canonical first-run path to existing proof commands.

.DESCRIPTION
  See docs/library/CANONICAL_FIRST_RUN_PATH.md. Does not replace FIRST_PILOT_OPERATOR_PATH.md detail.
#>
param(
    [ValidateSet('Readiness', 'CommittedProof', 'SponsorHandoff')]
    [string] $Phase = 'Readiness',
    [string] $RunId = '',
    [string] $BaseUrl = '',
    [switch] $FailOnHold
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

switch ($Phase) {
    'Readiness' {
        & (Join-Path $root 'scripts\Test-ArchLucidPrerequisites.ps1') -Profile FirstPilotMinimum
        & dotnet run --project (Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj') -- --json pilot preflight
        $proofArgs = @{ OutputDirectory = 'artifacts/first-pilot-proof' }

        if (-not [string]::IsNullOrWhiteSpace($BaseUrl)) {
            $proofArgs['BaseUrl'] = $BaseUrl.Trim()
        }

        & (Join-Path $root 'scripts\collect-first-pilot-proof.ps1') @proofArgs
    }

    'CommittedProof' {
        if ([string]::IsNullOrWhiteSpace($RunId)) {
            throw 'CommittedProof requires -RunId.'
        }

        $proofArgs = @{
            RunId           = $RunId.Trim()
            OutputDirectory = 'artifacts/first-pilot-proof'
        }

        if (-not [string]::IsNullOrWhiteSpace($BaseUrl)) {
            $proofArgs['BaseUrl'] = $BaseUrl.Trim()
        }

        & (Join-Path $root 'scripts\collect-first-pilot-proof.ps1') @proofArgs
    }

    'SponsorHandoff' {
        if ([string]::IsNullOrWhiteSpace($RunId)) {
            throw 'SponsorHandoff requires -RunId.'
        }

        $proofArgs = @{
            RunId           = $RunId.Trim()
            SponsorHandoff  = $true
            OutputDirectory = 'artifacts/first-pilot-proof'
        }

        if ($FailOnHold) {
            $proofArgs['FailOnHold'] = $true
        }

        if (-not [string]::IsNullOrWhiteSpace($BaseUrl)) {
            $proofArgs['BaseUrl'] = $BaseUrl.Trim()
        }

        & (Join-Path $root 'scripts\collect-first-pilot-proof.ps1') @proofArgs
    }

    default {
        throw "Unsupported phase: $Phase"
    }
}
