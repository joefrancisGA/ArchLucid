<#
.SYNOPSIS
    Collects read-only Azure ARM inventory for ArchLucid ingestion (schema-versioned ZIP).

.NOTES
    - No ArchLucid credentials run in this tenant. Output is uploaded by you to ArchLucid.
    - This script performs **read-only** Azure Resource Manager inventory (Get-AzResource) and Policy Insights policy state queries (Invoke-AzRestMethod POST on PolicyStates/latest/queryResults, the same read surface as Get-AzPolicyState).
    - **Never collected:** Key Vault secret values, connection strings, certificates/private keys, arbitrary user PII beyond resource tags.
    - `-IncludeRetailPrices` emits `retail-prices.json` by calling the **public** HTTPS Retail Prices API (`https://prices.azure.com`) for App Service plans and SQL databases inventoried in `resources.json`; no extra RBAC beyond ARM read access.
    - Every run emits `policy-compliance.json` via Azure Policy Insights PolicyStates/latest/queryResults (same read plane as `Get-AzPolicyState`); pagination and throttling backoff are handled in the collector. Reader at subscription or resource-group scope is sufficient for typical tenants.
    - Optional Cost Management / Advisor packages (`-IncludeCost`, `-IncludeAdvisor`) remain backlog; see docs/library/V1_SCOPE.md §2.16.
    - Verify script integrity (code signing / checksum) per your change-management policy before executing in production subscriptions.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string] $ResourceGroupScope = "",

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeCost,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeAdvisor,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeRetailPrices
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string] $Path, [string] $Content)
{
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.RetailPrices.helpers.ps1')
. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.PolicyCompliance.helpers.ps1')

if (-not (Get-Module -ListAvailable -Name Az.Resources))
{
    throw "Az.Resources module is required. Install: Install-Module Az -Scope CurrentUser"
}

if (-not (Get-Module -ListAvailable -Name Az.Accounts))
{
    throw "Az.Accounts module is required for policy compliance REST calls. Install: Install-Module Az -Scope CurrentUser"
}

Import-Module Az.Resources -ErrorAction Stop
Import-Module Az.Accounts -ErrorAction Stop

$null = Get-AzSubscription -SubscriptionId $SubscriptionId -ErrorAction Stop
Set-AzContext -SubscriptionId $SubscriptionId | Out-Null

$scriptVersion = "0.3.0"
$schemaVersion = 1
$collectionTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$azProfile = Get-Module Az.Resources
$azModuleVersion = if ($azProfile) { $azProfile.Version.ToString() } else { "unknown" }

$switchesUsed = @()
if ($IncludeCost) { $switchesUsed += "IncludeCost" }
if ($IncludeAdvisor) { $switchesUsed += "IncludeAdvisor" }
if ($IncludeRetailPrices) { $switchesUsed += "IncludeRetailPrices" }

$scopeDescriptor = if ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
{
    "/subscriptions/$SubscriptionId"
}
else
{
    "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupScope"
}

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDir))
{
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-azure-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $staging | Out-Null

try
{
    if ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
    {
        $resources = Get-AzResource -Verbose:$false | ForEach-Object {
            [ordered]@{
                resourceType = $_.ResourceType
                resourceId = $_.ResourceId
                name = $_.Name
                location = $_.Location
                sku = $_.Sku
                tags = $_.Tags
                properties = @{
                    provisioningState = $_.Properties.provisioningState
                }
            }
        }
    }
    else
    {
        $resources = Get-AzResource -ResourceGroupName $ResourceGroupScope -Verbose:$false | ForEach-Object {
            [ordered]@{
                resourceType = $_.ResourceType
                resourceId = $_.ResourceId
                name = $_.Name
                location = $_.Location
                sku = $_.Sku
                tags = $_.Tags
                properties = @{
                    provisioningState = $_.Properties.provisioningState
                }
            }
        }
    }

    $manifest = [ordered]@{
        schemaVersion = $schemaVersion
        scriptVersion = $scriptVersion
        collectionTimestamp = $collectionTimestamp
        subscriptionId = $SubscriptionId
        scope = $scopeDescriptor
        switchesUsed = $switchesUsed
        azModuleVersion = $azModuleVersion
    }

    $manifestPath = Join-Path $staging "manifest.json"
    $resourcesPath = Join-Path $staging "resources.json"
    Write-Utf8NoBom $manifestPath ($manifest | ConvertTo-Json -Depth 10)
    Write-Utf8NoBom $resourcesPath ($resources | ConvertTo-Json -Depth 10)

    $policyCompliance = New-ArchLucidPolicyComplianceDocument `
        -SubscriptionId $SubscriptionId `
        -ScopeDescriptor $scopeDescriptor `
        -CollectionTimestampUtc $collectionTimestamp `
        -ResourceGroupScope $ResourceGroupScope `
        -PolicyComplianceSchemaVersion 1 `
        -PageSize 450

    $policyCompliancePath = Join-Path $staging "policy-compliance.json"
    Write-Utf8NoBom $policyCompliancePath ($policyCompliance | ConvertTo-Json -Depth 12)

    $retailReadmeTail = ""

    if ($IncludeRetailPrices)
    {

        $retailUtc = (Get-Date).ToUniversalTime().ToString("o")

        $retailDoc = New-ArchLucidRetailPricesDocument `
            -Inventory @($resources) `
            -QueryTimestampUtc $retailUtc `
            -RetailApiVersion "2023-01-01-preview"

        $retailPayload = $retailDoc | ConvertTo-Json -Depth 12 -Compress:$false

        Write-Utf8NoBom (Join-Path $staging "retail-prices.json") $retailPayload

        $retailReadmeTail = @"

Retail pack: `retail-prices.json` was added for this run (USD consumption rows from https://prices.azure.com for App Service plans and SQL databases appearing in `resources.json`; HTTPS GET only, no extra Azure RBAC scopes).
"@

    }

    $readmeExtra = ""

    if (-not ([string]::IsNullOrWhiteSpace($retailReadmeTail)))
    {
        $readmeExtra = [Environment]::NewLine + $retailReadmeTail.TrimEnd() + [Environment]::NewLine
    }

    $readme = @"
ArchLucid Azure extractor output (read-only inventory).
Schema version: $schemaVersion
Collection UTC: $collectionTimestamp
$readmeExtra
Each ZIP includes `policy-compliance.json` (Policy Insights latest states, Reader-scoped). When not using `-IncludeRetailPrices`, no live retail catalog JSON is written. Cost Management / Advisor exports require future implementations of `-IncludeCost` / `-IncludeAdvisor` — see docs/library/V1_SCOPE.md §2.16 and docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md.
Upload via POST /v1/azure-extractor/upload (ExecuteAuthority). Trust stance: docs/go-to-market/TRUST_CENTER.md.
"@

    Write-Utf8NoBom (Join-Path $staging "README.txt") $readme

    if ($IncludeCost -or $IncludeAdvisor)
    {

        Write-Warning "IncludeCost and IncludeAdvisor are not yet implemented — extend when Cost Management / Advisor exporters are wired."

    }

    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
    Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutputPath -CompressionLevel Optimal
}
finally
{
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}
