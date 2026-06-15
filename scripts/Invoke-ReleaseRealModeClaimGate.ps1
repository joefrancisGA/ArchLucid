#!/usr/bin/env pwsh
<#
.SYNOPSIS
  TB-166 release claim gate — quad-agent fixtures + real-llm-evidence-gate.json.

.DESCRIPTION
  Exits 0 when release copy may claim full real-mode AI (fixtures + gate PASS + pipeline profile).
  Set ARCHLUCID_RELEASE_SIMULATOR_ONLY=1 for explicit simulator-only releases.
  Set ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1 to require gate json (pairs with Invoke-ReleaseRealLlmEvidenceRequirement.ps1).
  Set ARCHLUCID_RC_STRICT_CLAIMS=1 for buyer-facing RC signoff (or pass -RcStrictClaims).

.PARAMETER MarkdownOut
  Summary path (default: artifacts/release/real-mode-claim-gate.md).

.PARAMETER JsonOut
  Machine-readable claim gate path (default: artifacts/release/real-mode-claim-gate.json).
#>
[CmdletBinding()]
param(
    [string] $MarkdownOut = 'artifacts/release/real-mode-claim-gate.md',
    [string] $JsonOut = 'artifacts/release/real-mode-claim-gate.json',
    [switch] $RcStrictClaims
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Join-Path $PSScriptRoot 'ci\check_release_real_mode_claim.py'
$gateJson = Join-Path $root 'artifacts/release/real-llm-evidence-gate.json'

[string] $gitCommitSha = 'unknown'

try {
    [string] $resolvedSha = (& git -C $root rev-parse HEAD 2>$null)

    if (-not [string]::IsNullOrWhiteSpace($resolvedSha)) {
        $gitCommitSha = $resolvedSha.Trim()
    }
}
catch {
    $gitCommitSha = 'unknown'
}

$args = @(
    $python,
    '--markdown-out', $MarkdownOut,
    '--json-out', $JsonOut,
    '--gate-json', $gateJson
)

if ($env:ARCHLUCID_RELEASE_SIMULATOR_ONLY -eq '1') {
    $args += '--allow-simulator-only'
}

if ($env:ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE -eq '1') {
    $args += '--require-gate'
}

if ($RcStrictClaims -or $env:ARCHLUCID_RC_STRICT_CLAIMS -eq '1') {
    $args += '--rc-strict-claims'
}

if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_RC_COMMIT_SHA)) {
    $args += @('--expected-commit-sha', $env:ARCHLUCID_RC_COMMIT_SHA.Trim())
}
elseif ($gitCommitSha -ne 'unknown') {
    $args += @('--expected-commit-sha', $gitCommitSha)
}

& python @args
exit $LASTEXITCODE
