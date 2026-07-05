#Requires -Version 7.0
<#
.SYNOPSIS
    Idempotently "wakes up" ArchLucid RAG retrieval infra for RC6 dev: Azure AI Search service + index,
    an Azure OpenAI embedding deployment, and the Container App wiring that points the API/worker at it.

.DESCRIPTION
    Owner decision (2026-07-05): Azure AI Search for RC6 dev is EPHEMERAL by design — it is not a standing
    resource. This script is safe to run repeatedly (every CD deploy calls it) and does nothing when
    everything it manages already exists. Its counterpart, Stash-RC6AzureSearchRetrieval.ps1, tears the
    search service back down.

    Steady state when nothing is "awake": ArchLucid falls back to Retrieval:VectorIndex=InMemory (no env
    vars set on the Container Apps). This script only adds Retrieval__*/AzureOpenAI__* env vars once the
    search service actually exists.

.PARAMETER ResourceGroup
    Resource group that hosts the dev Container Apps and dependent services.

.PARAMETER SkipEmbeddingDeployment
    Skip ensuring the Azure OpenAI embedding deployment (useful when only the search service/index matter).

.PARAMETER SkipContainerAppWiring
    Skip writing Retrieval__*/AzureOpenAI__* env vars onto the Container Apps (useful for a plain
    infra-only wake-up, e.g. from CD's auto-heal step, which may re-wire separately).
#>
[CmdletBinding()]
param(
    [string]$ResourceGroup               = 'rg-archlucid-dev',
    [string]$Location                    = 'eastus2',
    [string]$SearchServiceName           = 'srch-archlucid-dev',
    [string]$SearchSkuName               = 'basic',
    [string]$IndexName                   = 'archlucid-retrieval-dev',
    [string]$IndexDefinitionPath         = (Join-Path $PSScriptRoot '..\..\deploy\rc6\archlucid-retrieval-index.json'),
    [string]$OpenAiAccountName           = 'oai-archlucid-dev',
    [string]$EmbeddingDeploymentName     = 'text-embedding-3-small',
    [string]$EmbeddingModelName          = 'text-embedding-3-small',
    [string]$EmbeddingModelVersion       = '1',
    [string]$ApiAppName                  = 'archlucid-api',
    [string]$WorkerAppName               = 'archlucid-worker',
    [switch]$SkipEmbeddingDeployment,
    [switch]$SkipContainerAppWiring
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

# Returns $true/$false instead of throwing, for existence checks where a non-zero exit just means "not found".
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
if ([string]::IsNullOrWhiteSpace($subscriptionId)) {
    throw 'Could not resolve current Azure subscription. Run az login first.'
}

Write-Host "Subscription   : $subscriptionId"
Write-Host "Resource group : $ResourceGroup"
Write-Host "Search service : $SearchServiceName"
Write-Host "Index name     : $IndexName"

Write-Step 'Ensure Azure AI Search service exists'

$searchExists = Test-AzResourceExists @(
    'search', 'service', 'show',
    '--name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId
)

if ($searchExists) {
    Write-Host "Search service $SearchServiceName already exists."
}
else {
    Write-Host "Creating search service $SearchServiceName ($SearchSkuName, $Location)..."
    Invoke-AzChecked @(
        'search', 'service', 'create',
        '--name', $SearchServiceName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId,
        '--sku', $SearchSkuName,
        '--location', $Location,
        '--partition-count', '1',
        '--replica-count', '1'
    ) | Out-Null
    Write-Host "Created search service $SearchServiceName."
}

Write-Step 'Ensure retrieval index exists'

$searchAdminKey = (Invoke-AzChecked @(
    'search', 'admin-key', 'show',
    '--service-name', $SearchServiceName,
    '--resource-group', $ResourceGroup,
    '--subscription', $subscriptionId,
    '--query', 'primaryKey', '-o', 'tsv'
)).Trim()

$searchEndpoint = "https://$SearchServiceName.search.windows.net"

if (-not (Test-Path $IndexDefinitionPath)) {
    throw "Index definition not found at $IndexDefinitionPath"
}

$indexDefinition = Get-Content $IndexDefinitionPath -Raw | ConvertFrom-Json
$indexDefinition.name = $IndexName

$indexExists = $false
try {
    $indexCheckResponse = Invoke-WebRequest -Method Get `
        -Uri "$searchEndpoint/indexes/$($IndexName)?api-version=2024-07-01" `
        -Headers @{ 'api-key' = $searchAdminKey } `
        -SkipHttpErrorCheck
    $indexExists = ($indexCheckResponse.StatusCode -eq 200)
}
catch {
    $indexExists = $false
}

if ($indexExists) {
    Write-Host "Index $IndexName already exists."
}
else {
    Write-Host "Creating index $IndexName..."
    $indexJson = $indexDefinition | ConvertTo-Json -Depth 10
    $createResponse = Invoke-WebRequest -Method Post `
        -Uri "$searchEndpoint/indexes?api-version=2024-07-01" `
        -Headers @{ 'api-key' = $searchAdminKey; 'Content-Type' = 'application/json' } `
        -Body $indexJson `
        -SkipHttpErrorCheck
    if ($createResponse.StatusCode -ge 300) {
        throw "Failed to create index $IndexName ($($createResponse.StatusCode)): $($createResponse.Content)"
    }
    Write-Host "Created index $IndexName."
}

if (-not $SkipEmbeddingDeployment) {
    Write-Step 'Ensure Azure OpenAI embedding deployment'

    $deploymentNames = (Invoke-AzChecked @(
        'cognitiveservices', 'account', 'deployment', 'list',
        '--name', $OpenAiAccountName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId,
        '--query', '[].name',
        '-o', 'tsv'
    )).Trim() -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }

    $hasEmbedding = $deploymentNames -contains $EmbeddingDeploymentName

    if ($hasEmbedding) {
        Write-Host "Embedding deployment $EmbeddingDeploymentName already exists."
    }
    else {
        Write-Host "Creating embedding deployment $EmbeddingDeploymentName ($EmbeddingModelName v$EmbeddingModelVersion)..."
        Invoke-AzChecked @(
            'cognitiveservices', 'account', 'deployment', 'create',
            '--name', $OpenAiAccountName,
            '--resource-group', $ResourceGroup,
            '--subscription', $subscriptionId,
            '--deployment-name', $EmbeddingDeploymentName,
            '--model-name', $EmbeddingModelName,
            '--model-version', $EmbeddingModelVersion,
            '--model-format', 'OpenAI',
            '--sku-capacity', '1',
            '--sku-name', 'Standard'
        ) | Out-Null
        Write-Host "Created embedding deployment $EmbeddingDeploymentName."
    }
}

if (-not $SkipContainerAppWiring) {
    Write-Step 'Wire Container App secrets and env vars (API + worker)'

    $openAiEndpoint = (Invoke-AzChecked @(
        'cognitiveservices', 'account', 'show',
        '--name', $OpenAiAccountName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId,
        '--query', 'properties.endpoint', '-o', 'tsv'
    )).Trim()

    $openAiKey = (Invoke-AzChecked @(
        'cognitiveservices', 'account', 'keys', 'list',
        '--name', $OpenAiAccountName,
        '--resource-group', $ResourceGroup,
        '--subscription', $subscriptionId,
        '--query', 'key1', '-o', 'tsv'
    )).Trim()

    foreach ($appName in @($ApiAppName, $WorkerAppName)) {
        Write-Host "Updating $appName..."

        Invoke-AzChecked @(
            'containerapp', 'secret', 'set',
            '--name', $appName,
            '--resource-group', $ResourceGroup,
            '--subscription', $subscriptionId,
            '--secrets',
                "archlucid-azure-search-api-key=$searchAdminKey",
                "archlucid-azure-openai-api-key=$openAiKey"
        ) | Out-Null

        Invoke-AzChecked @(
            'containerapp', 'update',
            '--name', $appName,
            '--resource-group', $ResourceGroup,
            '--subscription', $subscriptionId,
            '--set-env-vars',
                'Retrieval__VectorIndex=AzureSearch',
                "Retrieval__AzureSearch__Endpoint=$searchEndpoint",
                "Retrieval__AzureSearch__IndexName=$IndexName",
                'Retrieval__AzureSearch__ApiKey=secretref:archlucid-azure-search-api-key',
                'Retrieval__Reranking__Enabled=false',
                "AzureOpenAI__Endpoint=$openAiEndpoint",
                "AzureOpenAI__EmbeddingDeploymentName=$EmbeddingDeploymentName",
                'AzureOpenAI__ApiKey=secretref:archlucid-azure-openai-api-key'
        ) | Out-Null
    }

    Write-Host 'Container App wiring complete.'
}

Write-Step 'Done'
Write-Host "RAG retrieval is awake: $searchEndpoint (index: $IndexName)"
