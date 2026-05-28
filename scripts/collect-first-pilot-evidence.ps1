#requires -Version 5.1
<#
.SYNOPSIS
  Collect buyer-safe first-pilot evidence for a committed architecture review run.

.DESCRIPTION
  Non-interactive folder bundle: run metadata, pilot-run-deltas, first-value report, audit slice metadata,
  health/version, OpenAPI stamp, and a checksum manifest. Reuses existing API routes only.

.PARAMETER BaseUrl
  API root without trailing slash (defaults to ARCHLUCID_API_URL or http://localhost:5128).

.PARAMETER RunId
  Committed architecture review run id (GUID).

.PARAMETER OutputDirectory
  Parent folder for timestamped evidence output (default: artifacts/first-pilot-evidence).

.EXAMPLE
  ./collect-first-pilot-evidence.ps1 -BaseUrl https://staging.example -RunId b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf
#>
param(
    [string] $BaseUrl = '',
    [Parameter(Mandatory = $true)]
    [string] $RunId,
    [string] $OutputDirectory = 'artifacts/first-pilot-evidence',
    [string] $BearerToken = '',
    [string] $ApiKey = ''
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

$root = Split-Path -Parent $PSScriptRoot
$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = Join-Path (Get-Location) $OutputDirectory
$bundleDir = Join-Path $outRoot "first-pilot-evidence-$timestamp"
New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null

$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

function Invoke-ArchLucidGet {
    param(
        [Parameter(Mandatory = $true)][string] $RelativePath,
        [Parameter(Mandatory = $true)][string] $OutFile
    )

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 120
        OutFile         = $OutFile
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    try {
        Invoke-WebRequest @req | Out-Null
    }
    catch {
        throw "GET $RelativePath failed: $($_.Exception.Message)"
    }
}

function Invoke-ArchLucidGetText {
    param(
        [Parameter(Mandatory = $true)][string] $RelativePath
    )

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 120
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    $response = Invoke-WebRequest @req
    return [string]$response.Content
}

function Convert-JsonTextToObject {
    param([string] $Json)

    if ([string]::IsNullOrWhiteSpace($Json)) {
        return $null
    }

    try {
        return $Json | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        return $null
    }
}

function Get-JsonPropertyValue {
    param(
        [object] $Object,
        [string] $Name
    )

    if ($null -eq $Object) {
        return $null
    }

    $property = $Object.PSObject.Properties[$Name]

    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Get-CollectionCount {
    param([object] $Value)

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [System.Array]) {
        return $Value.Count
    }

    if ($Value -is [System.Collections.ICollection]) {
        return $Value.Count
    }

    return $null
}

Write-Host "Collecting first-pilot evidence for run $RunId @ $normalizedBase"

Invoke-ArchLucidGet -RelativePath '/health/live' -OutFile (Join-Path $bundleDir 'health-live.json')
Invoke-ArchLucidGet -RelativePath '/health/ready' -OutFile (Join-Path $bundleDir 'health-ready.json')
Invoke-ArchLucidGet -RelativePath '/version' -OutFile (Join-Path $bundleDir 'version.json')
Invoke-ArchLucidGet -RelativePath '/openapi/v1.json' -OutFile (Join-Path $bundleDir 'openapi-v1.json')

$deltasPath = "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/pilot-run-deltas"
$deltasJson = Invoke-ArchLucidGetText -RelativePath $deltasPath
$deltasFile = Join-Path $bundleDir 'pilot-run-deltas.json'
[System.IO.File]::WriteAllText($deltasFile, $deltasJson, [System.Text.UTF8Encoding]::new($false))

Invoke-ArchLucidGet -RelativePath "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/first-value-report" `
    -OutFile (Join-Path $bundleDir 'first-value-report.md')

$auditJson = Invoke-ArchLucidGetText -RelativePath '/v1/audit?take=25'
$auditFile = Join-Path $bundleDir 'audit-slice-metadata.json'
[System.IO.File]::WriteAllText($auditFile, $auditJson, [System.Text.UTF8Encoding]::new($false))

$runJson = Invoke-ArchLucidGetText -RelativePath "/v1/architecture/run/$([Uri]::EscapeDataString($RunId))"
$runFile = Join-Path $bundleDir 'run-detail-summary.json'
[System.IO.File]::WriteAllText($runFile, $runJson, [System.Text.UTF8Encoding]::new($false))

$healthReadyJson = [System.IO.File]::ReadAllText((Join-Path $bundleDir 'health-ready.json'))
$versionJson = [System.IO.File]::ReadAllText((Join-Path $bundleDir 'version.json'))
$openApiJson = [System.IO.File]::ReadAllText((Join-Path $bundleDir 'openapi-v1.json'))
$healthReady = Convert-JsonTextToObject $healthReadyJson
$version = Convert-JsonTextToObject $versionJson
$openApi = Convert-JsonTextToObject $openApiJson
$deltas = Convert-JsonTextToObject $deltasJson
$audit = Convert-JsonTextToObject $auditJson
$run = Convert-JsonTextToObject $runJson

$auditItems = Get-JsonPropertyValue $audit 'items'
$auditCount = Get-CollectionCount $auditItems

if ($null -eq $auditCount) {
    $auditCount = Get-CollectionCount $audit
}

$proofPackageCompleteness = Get-JsonPropertyValue $deltas 'proofPackageCompleteness'
$findingsBySeverity = Get-JsonPropertyValue $deltas 'findingsBySeverity'
$llmCallCount = Get-JsonPropertyValue $deltas 'llmCallCount'
$llmCallCountResolved = Get-JsonPropertyValue $deltas 'llmCallCountResolved'
$pilotStrictSignalsResolved = Get-JsonPropertyValue $deltas 'agentOutputPilotStrictSignalsResolved'
$pilotStrictViolatesSponsorEvidence = Get-JsonPropertyValue $deltas 'agentOutputPilotStrictViolatesSponsorEvidence'
$goldenManifestId = Get-JsonPropertyValue $run 'goldenManifestId'
$openApiInfo = Get-JsonPropertyValue $openApi 'info'
$openApiInfoVersion = Get-JsonPropertyValue $openApiInfo 'version'
$healthReadyStatus = Get-JsonPropertyValue $healthReady 'status'
$apiVersion = Get-JsonPropertyValue $version 'version'
$apiCommit = Get-JsonPropertyValue $version 'commit'
$openApiVersion = Get-JsonPropertyValue $openApi 'openapi'
$findingsBySeverityRowCount = Get-CollectionCount $findingsBySeverity

if ($null -eq $goldenManifestId) {
    $runObject = Get-JsonPropertyValue $run 'run'
    $goldenManifestId = Get-JsonPropertyValue $runObject 'goldenManifestId'
}

$qualityGateDisposition = 'not collected by this buyer-safe route'

if ($pilotStrictSignalsResolved -eq $true) {
    $qualityGateDisposition = if ($pilotStrictViolatesSponsorEvidence -eq $true) {
        'pilot-strict-violates-sponsor-evidence'
    }
    else {
        'pilot-strict-sponsor-evidence-pass'
    }
}
elseif ($pilotStrictSignalsResolved -eq $false) {
    $qualityGateDisposition = 'pilot-strict-signals-unresolved'
}

$estimatedUsdSavings = Get-JsonPropertyValue $deltas 'estimatedUsdSavings'
$isDemoTenant = Get-JsonPropertyValue $deltas 'isDemoTenant'
$roiEvidenceConfidence = Get-JsonPropertyValue $proofPackageCompleteness 'roiEvidenceConfidence'
$roiConfidenceLabel = Get-JsonPropertyValue $proofPackageCompleteness 'roiConfidenceLabel'
$sponsorProofReadiness = Get-JsonPropertyValue $proofPackageCompleteness 'sponsorProofReadiness'

$llmCostBasisLabel = 'unavailable'
$llmCostEvidenceResolved = $false

if ($llmCallCountResolved -eq $true) {
    $llmCostEvidenceResolved = $true

    if ($isDemoTenant -eq $true) {
        $llmCostBasisLabel = 'demo-derived'
    }
    elseif ($null -ne $llmCallCount -and [int]$llmCallCount -gt 0) {
        $llmCostBasisLabel = 'estimated'
    }
    else {
        $llmCostBasisLabel = 'simulator'
    }
}

$estimatedUsdSavingsBasisLabel = if ([string]::IsNullOrWhiteSpace([string]$roiConfidenceLabel)) {
    'not-collected'
}
else {
    [string]$roiConfidenceLabel
}

$observability = [ordered]@{
    formatVersion                 = '1.0'
    generatedUtc                  = $timestamp
    baseUrl                       = $normalizedBase
    runId                         = $RunId
    healthReadyStatus             = $healthReadyStatus
    apiVersion                    = $apiVersion
    apiCommit                     = $apiCommit
    openApiVersion                = $openApiVersion
    openApiInfoVersion            = $openApiInfoVersion
    goldenManifestId              = $goldenManifestId
    proofPackageCompleteness      = $proofPackageCompleteness
    findingsBySeverityRowCount    = $findingsBySeverityRowCount
    auditEventCountSample         = $auditCount
    llmCallCount                  = $llmCallCount
    llmCallCountResolved          = $llmCallCountResolved
    agentOutputPilotStrictSignalsResolved = $pilotStrictSignalsResolved
    agentOutputPilotStrictViolatesSponsorEvidence = $pilotStrictViolatesSponsorEvidence
    qualityGateDisposition        = $qualityGateDisposition
    estimatedUsdSavings           = $estimatedUsdSavings
    estimatedUsdSavingsBasisLabel = $estimatedUsdSavingsBasisLabel
    roiEvidenceConfidence         = $roiEvidenceConfidence
    sponsorProofReadiness         = $sponsorProofReadiness
    llmCostBasisLabel             = $llmCostBasisLabel
    llmCostEvidenceResolved       = $llmCostEvidenceResolved
    rawPromptOrCompletionIncluded = $false
    secretsIncluded               = $false
}
$observabilityJsonFile = Join-Path $bundleDir 'pilot-observability-summary.json'
$observability | ConvertTo-Json -Depth 8 | Set-Content -Path $observabilityJsonFile -Encoding UTF8

$observabilityMd = @"
# Pilot observability summary

Generated (UTC): **$timestamp**

| Signal | Value |
| --- | --- |
| Base URL | $normalizedBase |
| Run id | ``$RunId`` |
| Health ready status | $($observability.healthReadyStatus) |
| API version | $($observability.apiVersion) |
| API commit | $($observability.apiCommit) |
| OpenAPI | $($observability.openApiVersion) / info.version $($observability.openApiInfoVersion) |
| Golden manifest id | $($observability.goldenManifestId) |
| Audit event sample count | $($observability.auditEventCountSample) |
| LLM call count | $($observability.llmCallCount) |
| LLM call count resolved | $($observability.llmCallCountResolved) |
| PilotStrict signals resolved | $($observability.agentOutputPilotStrictSignalsResolved) |
| PilotStrict violates sponsor evidence | $($observability.agentOutputPilotStrictViolatesSponsorEvidence) |
| Quality gate disposition | $($observability.qualityGateDisposition) |
| Estimated USD savings | $($observability.estimatedUsdSavings) |
| Estimated savings basis | $($observability.estimatedUsdSavingsBasisLabel) |
| ROI evidence confidence | $($observability.roiEvidenceConfidence) |
| Sponsor proof readiness | $($observability.sponsorProofReadiness) |
| LLM cost basis label | $($observability.llmCostBasisLabel) |
| LLM cost evidence resolved | $($observability.llmCostEvidenceResolved) |

## Safety

- Raw prompts/completions included: **false**
- Secrets included: **false**
- Use this summary as a buyer-safe pointer to deeper internal diagnostics, not as a raw support bundle.
"@
$observabilityMdFile = Join-Path $bundleDir 'pilot-observability-summary.md'
[System.IO.File]::WriteAllText($observabilityMdFile, $observabilityMd, [System.Text.UTF8Encoding]::new($false))

$costSummaryMd = @"
# Pilot LLM cost summary (buyer-safe)

Generated (UTC): **$timestamp**

| Field | Value |
| --- | --- |
| Run id | ``$RunId`` |
| LLM call count | $($observability.llmCallCount) |
| LLM call count resolved | $($observability.llmCostEvidenceResolved) |
| LLM cost basis label | $($observability.llmCostBasisLabel) |
| Estimated USD savings | $($observability.estimatedUsdSavings) |
| Estimated savings basis | $($observability.estimatedUsdSavingsBasisLabel) |

This summary uses heuristic labels only. It is **not** invoice-grade Azure OpenAI billing truth.
"@
$costSummaryMdFile = Join-Path $bundleDir 'pilot-cost-summary.md'
[System.IO.File]::WriteAllText($costSummaryMdFile, $costSummaryMd, [System.Text.UTF8Encoding]::new($false))

$metadata = [ordered]@{
    generatedUtc = $timestamp
    baseUrl      = $normalizedBase
    runId        = $RunId
    bundleFormat = '1.0'
    buyerSafe    = @(
        'health-live.json',
        'health-ready.json',
        'version.json',
        'openapi-v1.json',
        'pilot-run-deltas.json',
        'first-value-report.md',
        'audit-slice-metadata.json',
        'run-detail-summary.json',
        'pilot-observability-summary.json',
        'pilot-observability-summary.md',
        'pilot-cost-summary.md',
        'README.md',
        'artifact-manifest.json'
    )
    internalOnly = @(
        'Full agent execution traces',
        'Raw prompts/completions',
        'Support bundle internals',
        'Secret-bearing configuration snapshots'
    )
}
$metadataFile = Join-Path $bundleDir 'run-metadata.json'
$metadata | ConvertTo-Json -Depth 6 | Set-Content -Path $metadataFile -Encoding UTF8

$readme = @"
# First-pilot evidence bundle

Generated (UTC): **$timestamp**

| Field | Value |
| --- | --- |
| Base URL | $normalizedBase |
| Run id | ``$RunId`` |

## What each artifact proves

| File | Proves |
| --- | --- |
| ``health-live.json`` / ``health-ready.json`` | Target environment was reachable and readiness gates passed at collection time. |
| ``version.json`` | Build identity stamped on the API host. |
| ``openapi-v1.json`` | Published v1 contract version served by the host (canonical ``/openapi/v1.json``). |
| ``pilot-run-deltas.json`` | Committed review semantics: findings summary, proof-package completeness, ROI deltas. |
| ``first-value-report.md`` | Sponsor-facing first-value narrative with basis labels. |
| ``audit-slice-metadata.json`` | Recent audit event metadata (types/ids — not raw payloads). |
| ``run-detail-summary.json`` | Run status, manifest linkage, and findings surface for the review. |
| ``pilot-observability-summary.json`` / ``pilot-observability-summary.md`` | Buyer-safe operational stamp: health, version, OpenAPI, audit sample count, LLM usage fields when available. |
| ``pilot-cost-summary.md`` | Buyer-safe LLM usage and savings basis labels (estimated/simulator/demo-derived/unavailable). |

## Buyer-safe vs internal-only

**Buyer-safe by default:** files listed in ``run-metadata.json`` → ``buyerSafe``.

**Internal-only (do not attach to buyer packets):** full support bundles, raw LLM traces, prompts, secrets, or unredacted config exports.

## Related

- Operator path: ``docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md``
- Email-sized ZIP variant: ``archlucid buyer-proof-pack <runId> --out proof.zip``
"@
$readmeFile = Join-Path $bundleDir 'README.md'
[System.IO.File]::WriteAllText($readmeFile, $readme, [System.Text.UTF8Encoding]::new($false))

$manifestEntries = @()
Get-ChildItem -Path $bundleDir -File | Where-Object { $_.Name -ne 'artifact-manifest.json' } | ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
    $manifestEntries += [ordered]@{
        path   = $_.Name
        sha256 = $hash.Hash.ToLowerInvariant()
        bytes  = $_.Length
    }
}

$manifest = [ordered]@{
    formatVersion = '1.0'
    generatedUtc  = $timestamp
    runId         = $RunId
    files         = $manifestEntries
}
$manifestPath = Join-Path $bundleDir 'artifact-manifest.json'
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Wrote first-pilot evidence bundle: $bundleDir"
exit 0
