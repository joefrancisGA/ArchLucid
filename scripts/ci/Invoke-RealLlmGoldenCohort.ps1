#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Credentialed real-LLM golden cohort shell (Improvement #9): runs live gate when secrets exist; otherwise SKIPPED_NO_CREDENTIALS.

.PARAMETER SessionMarkdownOut
  Session record path (default: docs/quality/REAL_LLM_SESSION_<yyyy-MM-dd>.md).

.PARAMETER GateMarkdownOut
  Gate summary path passed to Invoke-RealLlmEvidenceGate.ps1.

.NOTES
  Accepts AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY, ARCHLUCID_REAL_AOAI_TEST_*,
  or ARCHLUCID_CI_REAL_AOAI_* (mapped for the gate).
  Never prints secret values. Default CI must not fail when credentials are absent.
#>
[CmdletBinding()]
param(
    [string] $SessionMarkdownOut = '',
    [string] $GateMarkdownOut = 'artifacts/release/real-llm-evidence-gate.md'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $root

$dateStamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
if ([string]::IsNullOrWhiteSpace($SessionMarkdownOut)) {
    $SessionMarkdownOut = "docs/quality/REAL_LLM_SESSION_$dateStamp.md"
}

function Test-RealLlmCredentialsPresent {
    $azureEndpoint = $env:AZURE_OPENAI_ENDPOINT
    $azureKey = $env:AZURE_OPENAI_API_KEY
    $testEndpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT
    $testKey = $env:ARCHLUCID_REAL_AOAI_TEST_KEY
    $ciEndpoint = $env:ARCHLUCID_CI_REAL_AOAI_ENDPOINT
    $ciKey = $env:ARCHLUCID_CI_REAL_AOAI_KEY

    if ((-not [string]::IsNullOrWhiteSpace($azureEndpoint)) -and (-not [string]::IsNullOrWhiteSpace($azureKey))) {
        return $true
    }

    if ((-not [string]::IsNullOrWhiteSpace($testEndpoint)) -and (-not [string]::IsNullOrWhiteSpace($testKey))) {
        return $true
    }

    if ((-not [string]::IsNullOrWhiteSpace($ciEndpoint)) -and (-not [string]::IsNullOrWhiteSpace($ciKey))) {
        return $true
    }

    return $false
}

function Sync-RealAoaiEnvFromAzureOpenAi {
    if ([string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT)) {
        if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_CI_REAL_AOAI_ENDPOINT)) {
            $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT = $env:ARCHLUCID_CI_REAL_AOAI_ENDPOINT
        }
        elseif (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_ENDPOINT)) {
            $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT = $env:AZURE_OPENAI_ENDPOINT
        }
    }

    if ([string]::IsNullOrWhiteSpace($env:ARCHLUCID_REAL_AOAI_TEST_KEY)) {
        if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_CI_REAL_AOAI_KEY)) {
            $env:ARCHLUCID_REAL_AOAI_TEST_KEY = $env:ARCHLUCID_CI_REAL_AOAI_KEY
        }
        elseif (-not [string]::IsNullOrWhiteSpace($env:AZURE_OPENAI_API_KEY)) {
            $env:ARCHLUCID_REAL_AOAI_TEST_KEY = $env:AZURE_OPENAI_API_KEY
        }
    }
}

function Write-SkippedSessionMarkdown {
    param([string]$DestinationPath)

    $buildScript = Join-Path $PSScriptRoot 'build_real_llm_session_record.py'
    $destinationAbs =
        if ([System.IO.Path]::IsPathRooted($DestinationPath)) {
            $DestinationPath
        }
        else {
            Join-Path $root $DestinationPath
        }

    & python $buildScript `
        --session-markdown-out $destinationAbs `
        --gate-markdown-rel 'artifacts/release/real-llm-evidence-gate.md'

    if ($LASTEXITCODE -ne 0) {
        throw "build_real_llm_session_record.py failed with exit code $LASTEXITCODE"
    }
}

$credsPresent = Test-RealLlmCredentialsPresent

if (-not $credsPresent) {
    Write-Host 'SKIPPED_NO_CREDENTIALS: AZURE_OPENAI_*, ARCHLUCID_REAL_AOAI_TEST_*, or ARCHLUCID_CI_REAL_AOAI_* not set; exiting 0.' -ForegroundColor Yellow
    Write-SkippedSessionMarkdown -DestinationPath $SessionMarkdownOut
    Write-Host "Wrote $SessionMarkdownOut" -ForegroundColor Green
    exit 0
}

Sync-RealAoaiEnvFromAzureOpenAi

$gateScript = Join-Path $PSScriptRoot '..\Invoke-RealLlmEvidenceGate.ps1'
& $gateScript -MarkdownOut $GateMarkdownOut
$gateExit = $LASTEXITCODE

$sessionAbs =
    if ([System.IO.Path]::IsPathRooted($SessionMarkdownOut)) {
        $SessionMarkdownOut
    }
    else {
        Join-Path $root $SessionMarkdownOut
    }

$gateRel = $GateMarkdownOut.Replace('\', '/')
$gateJsonPath = Join-Path $root 'artifacts/release/real-llm-evidence-gate.json'
$buildScript = Join-Path $PSScriptRoot 'build_real_llm_session_record.py'
& python $buildScript `
    --gate-json $gateJsonPath `
    --gate-markdown-rel $gateRel `
    --session-markdown-out $sessionAbs `
    --credentials-present `
    --dotnet-exit-code $gateExit

if ($LASTEXITCODE -ne 0) {
    throw "build_real_llm_session_record.py failed with exit code $LASTEXITCODE"
}

Write-Host "Wrote $SessionMarkdownOut" -ForegroundColor Green

exit $gateExit
