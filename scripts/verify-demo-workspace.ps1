#requires -Version 5.1
<#
.SYNOPSIS
  Verify demo workspace anchors before a live demo or sales call.

.DESCRIPTION
  Checks pinned demo workspace run ids from fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json
  against the target API: committed review present, pilot-run-deltas, first-value report, traceability bundle.

.PARAMETER BaseUrl
  API root (defaults to ARCHLUCID_API_URL or http://localhost:5128).

.EXAMPLE
  ./verify-demo-workspace.ps1 -BaseUrl http://localhost:5128
#>
param(
    [string] $BaseUrl = '',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [ValidateSet('A', 'B', 'Both')]
    [string] $Workspace = 'Both'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot 'fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json'

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing demo workspace manifest: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$checks = [System.Collections.Generic.List[string]]::new()
$failures = 0

function Test-DemoRun {
    param(
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][string] $RunId,
        [Parameter(Mandatory = $true)][int] $ExpectedFindingCount
    )

    function Invoke-Probe {
        param([string] $RelativePath)

        $uri = "$normalizedBase$RelativePath"
        $req = @{
            Uri             = $uri
            Method          = 'Get'
            UseBasicParsing = $true
            TimeoutSec      = 60
        }

        if ($headers.Count -gt 0) {
            $req.Headers = $headers
        }

        return Invoke-WebRequest @req
    }

    try {
        $deltas = Invoke-Probe -RelativePath "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/pilot-run-deltas"
        $deltasObj = $deltas.Content | ConvertFrom-Json

        if (-not $deltasObj.proofPackageCompleteness.committedManifestPresent) {
            throw 'pilot-run-deltas proofPackageCompleteness.committedManifestPresent is false'
        }

        $severityTotal = 0

        if ($null -ne $deltasObj.findingsBySeverity) {
            foreach ($row in $deltasObj.findingsBySeverity) {
                $severityTotal += [int]$row.count
            }
        }

        if ($severityTotal -lt $ExpectedFindingCount) {
            throw "findingsBySeverity total $severityTotal < expected $ExpectedFindingCount"
        }

        Invoke-Probe -RelativePath "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/first-value-report" | Out-Null
        Invoke-Probe -RelativePath "/v1/architecture/run/$([Uri]::EscapeDataString($RunId))/traceability-bundle.zip" | Out-Null

        $script:checks.Add("| $Label | PASS | runId=$RunId findings=$severityTotal |")
    }
    catch {
        $script:failures++
        $detail = ($_.Exception.Message -replace '\r?\n', ' ')
        $script:checks.Add("| $Label | FAIL | $detail |")
    }
}

if ($Workspace -eq 'A' -or $Workspace -eq 'Both') {
    Test-DemoRun -Label 'Workspace A (product-tour)' `
        -RunId $manifest.workspaceA.runId `
        -ExpectedFindingCount ([int]$manifest.workspaceA.expectedCommittedFindingCount)
}

if ($Workspace -eq 'B' -or $Workspace -eq 'Both') {
    Test-DemoRun -Label 'Workspace B (regulated-scenario)' `
        -RunId $manifest.workspaceB.runId `
        -ExpectedFindingCount ([int]$manifest.workspaceB.expectedCommittedFindingCount)
}

Write-Host ''
Write-Host '=== Demo workspace verification ===' -ForegroundColor Cyan
Write-Host "Base URL: $normalizedBase"
Write-Host ''
Write-Host '| Check | Result | Detail |'
Write-Host '| --- | --- | --- |'
$checks | ForEach-Object { Write-Host $_ }
Write-Host ''

if ($failures -gt 0) {
    Write-Host "FAIL — $failures demo prerequisite(s) missing. See docs/go-to-market/DEMO_WORKSPACES.md" -ForegroundColor Red
    exit 1
}

Write-Host 'PASS — demo workspaces ready for a live demo.' -ForegroundColor Green
exit 0
