<#
.SYNOPSIS
  TB-2146 checklist: capture staging cold-start Phase A+B and apply paid-lever reopen gate.
#>
[CmdletBinding()]
param(
    [ValidateSet('staging', 'production', 'dev')]
    [string] $Environment = 'staging'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'TB-2146 — cold-start staging baseline + paid-lever reopen gate'
Write-Host ('Target environment: {0}' -f $Environment)
Write-Host 'Runbook: docs/runbooks/COLD_START_MEASUREMENT.md'
Write-Host 'Decision pack: docs/library/PERFORMANCE_COLD_START_AND_TRIMMING.md (TB-2124 / TB-2146)'
Write-Host ''

$items = @(
    'Routine CD to staging completed (note GitHub run URL + commit SHA)',
    'Phase A recorded from Deploy Container Apps + Post-deploy validation timestamps',
    'Phase B captured with scripts/ops/capture-cold-start-baseline.ps1 (-ApiBaseUrl + -ApiKey)',
    'Baseline markdown appended under docs/operations/cold-start-baselines/ and README table row added',
    'PERFORMANCE_COLD_START_AND_TRIMMING.md consolidated table updated with staging numbers',
    'If Phase A > 120 s or Phase B median >= 2.0 s: owner reopens only matching paid levers per decision table',
    'No silent api_min_replicas raise without cost note in the matrix'
)

$index = 1
foreach ($item in $items) {
    Write-Host ('  [{0}] {1}' -f $index, $item)
    $index++
}

Write-Host ''
Write-Host 'Remaining owner step: run capture script against the staging API after the next CD deploy.'
exit 0
