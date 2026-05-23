<#
.SYNOPSIS
    Collects read-only Azure ARM inventory and Azure Policy compliance states for ArchLucid ingestion (schema-versioned ZIP).

.NOTES
    - No ArchLucid credentials run in this tenant. Output is uploaded by you to ArchLucid.
    - This script performs **read-only** Azure Resource Manager inventory (Get-AzResource) and Policy Insights policy state queries (Invoke-AzRestMethod POST on PolicyStates/latest/queryResults, the same read surface as Get-AzPolicyState).
    - **Never collected:** Key Vault secret values, connection strings, certificates/private keys, arbitrary user PII beyond resource tags.
    - `-IncludeRetailPrices` emits `retail-prices.json` by calling the **public** HTTPS Retail Prices API (`https://prices.azure.com`) for App Service plans, SQL databases, Virtual Machines, and Storage Accounts inventoried in `resources.json`; HTTPS GET only — no RBAC beyond Reader-style ARM read access (same as other catalog probes).
    - Every run emits `policy-compliance.json` via Azure Policy Insights PolicyStates/latest/queryResults (same read plane as `Get-AzPolicyState`); pagination and throttling backoff are handled in the collector. Reader at subscription or resource-group scope is sufficient for typical tenants.
    - `-IncludeCost` merges subscription-scope **ActualCost** into **`manifest.json`** (`actualCostSummary`) via Azure CLI **`az rest`** calls to **`Microsoft.CostManagement/query`** (Cost Management Reader or equivalent RBAC plus `az` on PATH required; null + warning when access fails). Advisor (`-IncludeAdvisor`) remains backlog; see docs/library/V1_SCOPE.md §2.16 for remaining optional surfaces.
    - Verify script integrity (code signing / checksum) per your change-management policy before executing in production subscriptions.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string] $SubscriptionId = "",

    [Parameter(Mandatory = $false)]
    [string] $ManagementGroupId = "",

    [Parameter(Mandatory = $false)]
    [string] $ResourceGroupScope = "",

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeCost,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeAdvisor,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeRetailPrices,

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

try {
    if (-not (Get-Module -ListAvailable -Name Az.Accounts)) { throw "Az.Accounts missing" }
    if (-not (Get-Module -ListAvailable -Name Az.Resources)) { throw "Az.Resources missing" }
    Import-Module Az.Accounts -ErrorAction Stop
    Import-Module Az.Resources -ErrorAction Stop
} catch {
    Write-Host "WARNING: Required Azure modules (Az.Accounts, Az.Resources) are missing or failed to import. Please run 'Install-Module Az' to install them." -ForegroundColor Yellow
    exit 1
}

function Write-Utf8NoBom([string] $Path, [string] $Content)
{
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function New-ArchLucidCollectedArmResourceRecord([object] $AzResource)
{
    if ($null -eq $AzResource) { throw [System.ArgumentNullException]::new("AzResource") }

    $props = @{
        provisioningState = $AzResource.Properties.provisioningState
    }

    if ([string]::Equals($AzResource.ResourceType, "Microsoft.Compute/virtualMachines",
            [System.StringComparison]::OrdinalIgnoreCase))
    {

        try
        {

            [string]$vs = "$( $AzResource.Properties.hardwareProfile.vmSize )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($vs)))
            {

                $props["vmSize"] = $vs

            }

        }

        catch
        {

        }

    }

    return [ordered]@{
        resourceType = $AzResource.ResourceType
        resourceId = $AzResource.ResourceId
        name = $AzResource.Name
        location = $AzResource.Location
        sku = $AzResource.Sku
        tags = $AzResource.Tags
        properties = $props
    }

}

. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.RetailPrices.helpers.ps1')
. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.PolicyCompliance.helpers.ps1')
. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.CostManagement.helpers.ps1')
. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.ResourceGraph.helpers.ps1')

if ([string]::IsNullOrWhiteSpace($SubscriptionId) -and [string]::IsNullOrWhiteSpace($ManagementGroupId))
{
    throw "Specify -SubscriptionId or -ManagementGroupId."
}

if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)) -and -not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
{
    throw "Specify only one of -SubscriptionId or -ManagementGroupId."
}

if ($IncludeCost -and [string]::IsNullOrWhiteSpace($SubscriptionId))
{
    throw "-IncludeCost requires -SubscriptionId (management-group inventory does not aggregate cost in one call)."
}

if ($DryRun)
{
    Write-Host "ArchLucid Azure extractor dry run — no data will be collected and no ZIP will be written." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Scope:" -ForegroundColor Yellow
    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        Write-Host "  Management group: $ManagementGroupId"
        if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
        {
            Write-Host "  Resource group filter: $ResourceGroupScope"
        }
    }
    else
    {
        Write-Host "  Subscription: $SubscriptionId"
        if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
        {
            Write-Host "  Resource group filter: $ResourceGroupScope"
        }
    }
    Write-Host ""
    Write-Host "Planned Azure API calls (read-only):" -ForegroundColor Yellow
    Write-Host "  - Get-AzSubscription / Set-AzContext (subscription scope only)"
    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        Write-Host "  - Azure Resource Graph query (management group inventory)"
    }
    elseif (Get-Module -ListAvailable -Name Az.ResourceGraph)
    {
        Write-Host "  - Azure Resource Graph query (subscription inventory)"
    }
    else
    {
        if ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
        {
            Write-Host "  - Get-AzResource (subscription-wide ARM inventory)"
        }
        else
        {
            Write-Host "  - Get-AzResource -ResourceGroupName $ResourceGroupScope"
        }
    }
    Write-Host "  - Policy Insights PolicyStates/latest/queryResults (policy-compliance.json)"
    if ($IncludeRetailPrices)
    {
        Write-Host "  - HTTPS GET https://prices.azure.com (retail-prices.json for inventoried SKUs)"
    }
    if ($IncludeCost)
    {
        Write-Host "  - az rest Microsoft.CostManagement/query (actualCostSummary in manifest.json)"
    }
    if ($IncludeAdvisor)
    {
        Write-Host "  - (not implemented) Azure Advisor recommendations export"
    }
    Write-Host ""
    Write-Host "Planned ZIP entries:" -ForegroundColor Yellow
    Write-Host "  manifest.json, resources.json, policy-compliance.json, policy.json, README.txt"
    if ($IncludeRetailPrices) { Write-Host "  retail-prices.json" }
    Write-Host ""
    Write-Host "Output path (would write): $OutputPath"
    Write-Host "Dry run complete — re-run without -DryRun to collect and create the ZIP."
    exit 0
}

if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
{
    $null = Get-AzSubscription -SubscriptionId $SubscriptionId -ErrorAction Stop
    Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
}

$scriptVersion = "0.3.2"
$schemaVersion = 1
$collectionTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$azProfile = Get-Module Az.Resources
$azModuleVersion = if ($azProfile) { $azProfile.Version.ToString() } else { "unknown" }

$switchesUsed = @()
if ($IncludeCost) { $switchesUsed += "IncludeCost" }
if ($IncludeAdvisor) { $switchesUsed += "IncludeAdvisor" }
if ($IncludeRetailPrices) { $switchesUsed += "IncludeRetailPrices" }

$scopeDescriptor = if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
{
    if ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
    {
        "/providers/Microsoft.Management/managementGroups/$ManagementGroupId"
    }
    else
    {
        "/providers/Microsoft.Management/managementGroups/$ManagementGroupId/resourceGroups/$ResourceGroupScope"
    }
}
elseif ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
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
    if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
    {
        if (-not (Get-Module -ListAvailable -Name Az.ResourceGraph))
        {
            throw "Az.ResourceGraph module is required for -ManagementGroupId. Install: Install-Module Az -Scope CurrentUser"
        }

        $resources = Get-ArchLucidAzureResourcesViaResourceGraphManagementGroup `
            -ManagementGroupId $ManagementGroupId `
            -ResourceGroupScope $ResourceGroupScope
    }
    elseif (Get-Module -ListAvailable -Name Az.ResourceGraph)
    {
        $resources = Get-ArchLucidAzureResourcesViaResourceGraph `
            -SubscriptionId $SubscriptionId `
            -ResourceGroupScope $ResourceGroupScope
    }
    elseif ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
    {
        $resources = Get-AzResource -Verbose:$false | ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ }
    }
    else
    {
        $resources =
            Get-AzResource -ResourceGroupName $ResourceGroupScope -Verbose:$false |
                ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ }
    }

    # SECURITY BOUNDARY: Explicitly filter out Key Vault secrets to ensure we strictly grab structural ARM metadata and NEVER request data plane or secret contents.
    $resources = @($resources) | Where-Object { $_.resourceType -ne "Microsoft.KeyVault/vaults/secrets" }

    $manifest = [ordered]@{
        schemaVersion = $schemaVersion
        scriptVersion = $scriptVersion
        collectionTimestamp = $collectionTimestamp
        subscriptionId = if ([string]::IsNullOrWhiteSpace($SubscriptionId)) { $null } else { $SubscriptionId }
        managementGroupId = if ([string]::IsNullOrWhiteSpace($ManagementGroupId)) { $null } else { $ManagementGroupId }
        scope = $scopeDescriptor
        switchesUsed = $switchesUsed
        azModuleVersion = $azModuleVersion
    }

    if ($IncludeCost)
    {

        $manifest["actualCostSummary"] =
            $(Get-ArchLucidActualCostSummary -SubscriptionId $SubscriptionId)
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

    $policyData = [ordered]@{
        policyDefinitions = @()
        policyAssignments = @()
    }

    try {
        if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
        {
            $policyData.policyDefinitions = @(Get-AzPolicyDefinition -ManagementGroupName $ManagementGroupId)
            $policyData.policyAssignments = @(Get-AzPolicyAssignment -ManagementGroupName $ManagementGroupId)
        }
        else
        {
            $policyData.policyDefinitions = @(Get-AzPolicyDefinition)
            if (-not ([string]::IsNullOrWhiteSpace($ResourceGroupScope)))
            {
                $policyData.policyAssignments = @(Get-AzPolicyAssignment -ResourceGroupName $ResourceGroupScope)
            }
            else
            {
                $policyData.policyAssignments = @(Get-AzPolicyAssignment)
            }
        }
    } catch {
        Write-Warning "Failed to collect policy definitions or assignments: $_"
    }

    $policyPath = Join-Path $staging "policy.json"
    Write-Utf8NoBom $policyPath ($policyData | ConvertTo-Json -Depth 10)

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

Retail pack: `retail-prices.json` was added for this run (USD consumption rows from https://prices.azure.com for App Service plans, SQL databases, Virtual Machines, and Storage Accounts appearing in `resources.json`; HTTPS GET only; no Azure RBAC beyond ARM Reader / typical Policy read surfaces used elsewhere in this package).
"@

    }

    $costReadmeTail = ""

    if ($IncludeCost)
    {

        $costReadmeTail = @"

Cost snapshot: when `-IncludeCost` was used, `manifest.json` includes `actualCostSummary` (**ActualCost** at subscription scope via Microsoft Cost Management / `az rest`). Assign **Cost Management Reader** (or equivalent) when you need spend rows; insufficient access yields `actualCostSummary: null` and a warning instead of failing the extractor.
"@

    }

    $readmeExtra = ""

    if (-not ([string]::IsNullOrWhiteSpace($retailReadmeTail)))
    {

        $readmeExtra = [Environment]::NewLine + $retailReadmeTail.TrimEnd() + [Environment]::NewLine
    }

    if (-not ([string]::IsNullOrWhiteSpace($costReadmeTail)))
    {

        $readmeExtra += [Environment]::NewLine + $costReadmeTail.TrimEnd() + [Environment]::NewLine
    }

    $readme = @"
ArchLucid Azure extractor output (read-only inventory).
Schema version: $schemaVersion
Collection UTC: $collectionTimestamp
$readmeExtra
Each ZIP includes `policy-compliance.json` (Policy Insights latest states, Reader-scoped) and `policy.json` (Policy definitions and assignments). When not using `-IncludeRetailPrices`, no live retail catalog JSON is written. Without `-IncludeCost`, `manifest.json` does not include `actualCostSummary`. Advisor export (`-IncludeAdvisor`) remains future work — see docs/library/V1_SCOPE.md §2.16 and docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md.
Upload via POST /v1/azure-extractor/upload (ExecuteAuthority). Trust stance: docs/go-to-market/TRUST_CENTER.md.
"@

    Write-Utf8NoBom (Join-Path $staging "README.txt") $readme

    if ($IncludeAdvisor)
    {

        Write-Warning "IncludeAdvisor is not yet implemented — extend when the Advisor exporter is wired."

    }

    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
    Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutputPath -CompressionLevel Optimal
}
finally
{
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}
