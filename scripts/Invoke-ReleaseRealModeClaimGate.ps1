#!/usr/bin/env pwsh
<#
.SYNOPSIS
  TB-166 release claim gate — quad-agent fixtures + real-llm-evidence-gate.json.

.DESCRIPTION
  Exits 0 when release copy may claim full real-mode AI (fixtures + gate PASS + pipeline profile).
  Set ARCHLUCID_RELEASE_SIMULATOR_ONLY=1 for explicit simulator-only releases.
  Set ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1 to require gate json (pairs with Invoke-ReleaseRealLlmEvidenceRequirement.ps1).

.PARAMETER MarkdownOut
  Summary path (default: artifacts/release/real-mode-claim-gate.md).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = 'artifacts/release/real-mode-claim-gate.md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Join-Path $PSScriptRoot 'ci\check_release_real_mode_claim.py'
$gateJson = Join-Path $root 'artifacts/release/real-llm-evidence-gate.json'
$args = @(
    $python,
    '--markdown-out', $MarkdownOut,
    '--gate-json', $gateJson
)

if ($env:ARCHLUCID_RELEASE_SIMULATOR_ONLY -eq '1') {
    $args += '--allow-simulator-only'
}

if ($env:ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE -eq '1') {
    $args += '--require-gate'
}

& python @args
exit $LASTEXITCODE
