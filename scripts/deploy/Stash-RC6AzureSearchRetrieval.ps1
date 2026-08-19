#Requires -Version 7.0
<#
.SYNOPSIS
    Idle-based nightly teardown for RC6 dev's ephemeral Azure AI Search service: saves the index
    definition + document count to blob storage, deletes the search service, and reverts the
    Container Apps to Retrieval:VectorIndex=InMemory.

.DESCRIPTION
    Owner decision (2026-07-05): default behavior across RC6 dev is to KEEP the search service alive.
    This script is only meant to be invoked by the nightly workflow, and only when the repo variable
    RAG_STASH_NIGHTLY is "true". It never deletes anything on its own schedule preference - the caller
    (the GitHub Actions workflow) owns that gate.

    Idle detection is a proxy, not a guarantee: it sums the SearchQueriesPerSecond metric over the
    lookback window. Direct-push indexing (ArchLucid writes chunks via the SDK, not pull indexers) is
    not separately observable through Azure Monitor for Search, so a quiet query volume is treated as
    "not actively being used" for MVP purposes. Pass -Force to skip the idle check entirely.

.PARAMETER Force
    Skip the idle check and stash+delete unconditionally.

.PARAMETER WhatIf
    Report what would happen (idle check, would-be blob path) without deleting or writing anything.
#>
[CmdletBinding()]
param(
    [string]$ResourceGroup           = 'rg-archlucid-dev',
    [string]$SearchServiceName       = 'srch-archlucid-dev',
    [string]$IndexName               = 'archlucid-retrieval-dev',
    [string]$ApiAppName              = 'archlucid-api',
    [string]$WorkerAppName           = 'archlucid-worker',
    [string]$StashStorageAccount     = 'starchlucidevarts',
    [string]$StashContainerName      = 'rag-retrieval-stash',
    [int]$IdleLookbackHours          = 24,
    [double]$IdleQueryThreshold      = 1.0,
    [switch]$Force,
    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)

    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-AzChecked {
    param([Parameter(Mandatory)][string[]]$Arguments)

    $output = & az @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "az $($Arguments -join ' ') failed:`n$output"
    }
    return $output
}

function Test-AzResourceExists {
    param([Parameter(Mandatory)][string[]]$Arguments)

    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $null = & az @Arguments 2>$null
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    return ($exitCode -eq 0)
}

$subscriptionId = (Invoke-AzChecked @('account', 'show', '--query', 'id', '-o', 'tsv')).Trim()

Write-Step 'Check whether the search service exists'

$searchExists = Test-AzResourceExists @(
    'search', 'service', 'show',
    '--name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId
)

if (-not $searchExists) {
    Write-Host "Search service $SearchServiceName does not exist - nothing to stash or tear down."
    exit 0
}

$searchResourceId = (Invoke-AzChecked @(
    'search', 'service', 'show',
    '--name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId,
    '--query', 'id', '-o', 'tsv'
)).Trim()

if (-not $Force) {
    Write-Step "Idle check (last $IdleLookbackHours h, threshold $IdleQueryThreshold total queries)"

    $startTime = (Get-Date).ToUniversalTime().AddHours(-$IdleLookbackHours).ToString('yyyy-MM-ddTHH:mm:ssZ')

    $metricsJson = Invoke-AzChecked @(
        'monitor', 'metrics', 'list',
        '--resource', $searchResourceId,
        '--metric', 'SearchQueriesPerSecond',
        '--start-time', $startTime,
        '--interval', 'PT1H',
        '--aggregation', 'Total',
        '-o', 'json'
    )

    $metrics = $metricsJson | ConvertFrom-Json
    $dataPoints = $metrics.value[0].timeseries[0].data | Where-Object { $null -ne $_.total }
    $totalQueries = ($dataPoints | Measure-Object -Property total -Sum).Sum
    if ($null -eq $totalQueries) { $totalQueries = 0 }

    Write-Host "Total query volume over lookback window: $totalQueries"

    if ($totalQueries -gt $IdleQueryThreshold) {
        Write-Host "Search service is NOT idle (threshold $IdleQueryThreshold) - leaving it running."
        exit 0
    }

    Write-Host 'Search service looks idle - proceeding with stash + teardown.'
}
else {
    Write-Host 'Force specified - skipping idle check.'
}

Write-Step 'Export index definition and document count'

$searchAdminKey = (Invoke-AzChecked @(
    'search', 'admin-key', 'show',
    '--service-name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId,
    '--query', 'primaryKey', '-o', 'tsv'
)).Trim()

$searchEndpoint = "https://$SearchServiceName.search.windows.net"

$indexDefResponse = Invoke-WebRequest -Method Get `
    -Uri "$searchEndpoint/indexes/$($IndexName)?api-version=2024-07-01" `
    -Headers @{ 'api-key' = $searchAdminKey } `
    -SkipHttpErrorCheck

$indexDefinition = if ($indexDefResponse.StatusCode -eq 200) { $indexDefResponse.Content | ConvertFrom-Json } else { $null }

$countUri = $searchEndpoint + '/indexes/' + $IndexName + '/docs/$count?api-version=2024-07-01'
$countResponse = Invoke-WebRequest -Method Get `
    -Uri $countUri `
    -Headers @{ 'api-key' = $searchAdminKey } `
    -SkipHttpErrorCheck

$documentCount = if ($countResponse.StatusCode -eq 200) { [int]$countResponse.Content } else { -1 }

$stashManifest = [ordered]@{
    stashedAtUtc      = (Get-Date).ToUniversalTime().ToString('o')
    searchServiceName = $SearchServiceName
    indexName         = $IndexName
    documentCount     = $documentCount
    indexDefinition   = $indexDefinition
}

$manifestJson = $stashManifest | ConvertTo-Json -Depth 10
$blobPath = "$IndexName/$(Get-Date -Format 'yyyy-MM-dd').json"
$latestBlobPath = "$IndexName/latest.json"

Write-Host "Document count: $documentCount"
Write-Host "Would write manifest to: $StashStorageAccount/$StashContainerName/$blobPath (and .../latest.json)"

if ($WhatIf) {
    Write-Host 'WhatIf specified - stopping before writing to blob storage or deleting the search service.'
    exit 0
}

Write-Step 'Upload stash manifest to blob storage'

$tempFile = New-TemporaryFile
Set-Content -Path $tempFile -Value $manifestJson -NoNewline

Invoke-AzChecked @(
    'storage', 'blob', 'upload',
    '--account-name', $StashStorageAccount,
    '--container-name', $StashContainerName,
    '--name', $blobPath,
    '--file', $tempFile,
    '--auth-mode', 'login',
    '--overwrite'
) | Out-Null

Invoke-AzChecked @(
    'storage', 'blob', 'upload',
    '--account-name', $StashStorageAccount,
    '--container-name', $StashContainerName,
    '--name', $latestBlobPath,
    '--file', $tempFile,
    '--auth-mode', 'login',
    '--overwrite'
) | Out-Null

Remove-Item $tempFile -Force

Write-Host "Manifest uploaded to $StashStorageAccount/$StashContainerName/$blobPath"

Write-Step 'Revert Container Apps to InMemory retrieval'

foreach ($appName in @($ApiAppName, $WorkerAppName)) {
    $appExists = Test-AzResourceExists @(
        'containerapp', 'show',
        '--name', $appName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId
    )
    if (-not $appExists) {
        Write-Host "$appName does not exist - skipping."

        continue
    }

    Write-Host "Reverting $appName..."
    Invoke-AzChecked @(
        'containerapp', 'update',
        '--name', $appName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId,
        '--remove-env-vars',
            'Retrieval__VectorIndex',
            'Retrieval__AzureSearch__Endpoint',
            'Retrieval__AzureSearch__IndexName',
            'Retrieval__AzureSearch__ApiKey',
            'Retrieval__Reranking__Enabled'
    ) | Out-Null
}

Write-Step 'Delete the search service'

Invoke-AzChecked @(
    'search', 'service', 'delete',
    '--name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId,
    '--yes'
) | Out-Null

Write-Host "Deleted search service $SearchServiceName. Next CD deploy (or manual Ensure-RC6AzureSearchRetrieval.ps1) recreates it."
