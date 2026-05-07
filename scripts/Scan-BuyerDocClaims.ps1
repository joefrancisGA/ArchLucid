#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Lightweight buyer-facing doc drift scan (heuristic regex warnings).

.PARAMETER RulesPath
  Path to buyer-doc-claim-rules.json (defaults alongside this script).

.PARAMETER FailOnHit
  Exit 1 when any rule matches (default: warnings only, exit 0).
#>
[CmdletBinding()]
param(
    [string] $RulesPath = (Join-Path $PSScriptRoot "buyer-doc-claim-rules.json"),
    [switch] $FailOnHit
)

$ErrorActionPreference = "Stop"
if (!(Test-Path $RulesPath)) {
    Write-Error "Missing rules: $RulesPath"
    exit 2
}

$cfg = Get-Content -Raw -Path $RulesPath | ConvertFrom-Json
$root = Split-Path -Parent $PSScriptRoot
$hits = 0

foreach ($rel in $cfg.targets) {
    $path = Join-Path $root $rel.Replace("/", [IO.Path]::DirectorySeparatorChar)
    if (!(Test-Path $path)) {
        Write-Warning "Missing target file: $rel"
        continue
    }
    $text = Get-Content -Raw -Path $path
    foreach ($rule in $cfg.rules) {
        $fragmentsProp = $rule.PSObject.Properties["ignorePathFragments"]
        if ($null -ne $fragmentsProp -and $fragmentsProp.Value) {
            $skip = $false
            foreach ($frag in $fragmentsProp.Value) {
                if ($rel -like "*$frag*") {
                    $skip = $true
                    break
                }
            }
            if ($skip) { continue }
        }
        if ($text -match $rule.pattern) {
            $hits++
            Write-Host "[HIT] $($rule.id)" -ForegroundColor Yellow
            Write-Host "  file: $rel"
            Write-Host "  hint: $($rule.hint)"
        }
    }
}

Write-Host "Scan complete. Hits: $hits" -ForegroundColor Cyan
if ($FailOnHit -and $hits -gt 0) { exit 1 }
exit 0
