#Requires -Version 7.0
<#
.SYNOPSIS
  Append a TB-962 worker replica-kill drill row to WORKER_REPLICA_KILL_DRILL_RESULTS.md.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string] $Environment = "staging",

    [Parameter(Mandatory = $true)]
    [string] $Revision,

    [Parameter(Mandatory = $true)]
    [ValidateSet("pass", "fail", "partial")]
    [string] $Outcome,

    [string] $Notes = "",

    [string] $Gaps = "",

    [switch] $Apply,

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$resultsPath = Join-Path $repoRoot "docs/quality/game-day-log/WORKER_REPLICA_KILL_DRILL_RESULTS.md"
$dateUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
$safeNotes = ($Notes -replace '\|', '/') -replace "`r?`n", ' '
$safeGaps = ($Gaps -replace '\|', '/') -replace "`r?`n", ' '
$row = "| $dateUtc | $Environment | $Revision | $Outcome | $safeNotes | $safeGaps |"

if ($WhatIf -or -not $Apply) {
    Write-Output $row
    return
}

$content = Get-Content -LiteralPath $resultsPath -Raw
$pending = "| _Pending first staging execution_ | staging | — | — | Runbook: [`TB-962_STAGING_WORKER_REPLICA_KILL_DRILL.md`](../runbooks/TB-962_STAGING_WORKER_REPLICA_KILL_DRILL.md) | — |"

if ($content -notmatch [regex]::Escape($pending)) {
    throw "Pending placeholder row not found in $resultsPath"
}

$content = $content.Replace($pending, $row)
Set-Content -LiteralPath $resultsPath -Value $content -NoNewline
Write-Output "Appended TB-962 drill row to $resultsPath"
