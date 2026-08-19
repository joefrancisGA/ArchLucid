#Requires -Version 7.0
<#
.SYNOPSIS
  Run TB-946 scale micro-drills (k6) and write summaries under artifacts/scale-micro-drill/.

.PARAMETER Drills
  Comma-separated drill ids: A, B, C (default all).

.PARAMETER WhatIf
  Print the command only.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string] $Drills = "A,B,C",

    [switch] $WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$bash = Get-Command bash -ErrorAction SilentlyContinue

if ($null -eq $bash) {
    throw "bash is required to invoke scripts/ci/run_scale_micro_drill.sh"
}

$argList = @(
    (Join-Path $repoRoot "scripts" "ci" "run_scale_micro_drill.sh"),
    "--drills",
    $Drills
)

if ($WhatIf) {
    Write-Host "Would run: bash $($argList -join ' ')"
    exit 0
}

Push-Location $repoRoot
try {
    if ($PSCmdlet.ShouldProcess("TB-946 scale micro-drill", "Run k6 drills $Drills")) {
        & bash @argList
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}
finally {
    Pop-Location
}
