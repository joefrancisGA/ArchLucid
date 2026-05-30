#Requires -Version 5.1
<#
.SYNOPSIS
  Creates or updates the GitHub ruleset that requires cohort-real-llm-gate on master/main.

.DESCRIPTION
  TB-138 operator helper. Requires authenticated `gh` with admin on the repository.
  Idempotent: if a ruleset named "Golden cohort real-LLM gate" already exists, PATCHes it;
  otherwise POSTs a new ruleset from .github/rulesets/golden-cohort-gate-required-check.json.

  Run after at least one green golden-cohort-nightly workflow on the default branch so the
  check name appears in GitHub autocomplete (required for merge enforcement to behave predictably).
#>
[CmdletBinding()]
param(
    [string]$Repo = 'joefrancisGA/ArchLucid'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$payloadPath = Join-Path $root '.github/rulesets/golden-cohort-gate-required-check.json'

if (-not (Test-Path -LiteralPath $payloadPath)) {
    throw "Missing ruleset payload: $payloadPath"
}

$payload = Get-Content -LiteralPath $payloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
$rulesetName = [string]$payload.name

$existingId = gh api "repos/$Repo/rulesets" --jq ".[] | select(.name==`"$rulesetName`") | .id" 2>$null

if ([string]::IsNullOrWhiteSpace($existingId)) {
    Write-Host "Creating ruleset '$rulesetName' on $Repo..."
    gh api --method POST "repos/$Repo/rulesets" --input $payloadPath | Out-Null
}
else {
    Write-Host "Updating ruleset '$rulesetName' (id=$existingId) on $Repo..."
    gh api --method PUT "repos/$Repo/rulesets/$existingId" --input $payloadPath | Out-Null
}

Write-Host "Done. Confirm in GitHub: Settings -> Rules -> Rulesets -> $rulesetName"
