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
    if (-not ($env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -eq '1'))
    {
        if (-not (Get-Module -ListAvailable -Name Az.Accounts)) { throw "Az.Accounts missing" }
        if (-not (Get-Module -ListAvailable -Name Az.Resources)) { throw "Az.Resources missing" }
        Import-Module Az.Accounts -ErrorAction Stop
        Import-Module Az.Resources -ErrorAction Stop
    }
} catch {
    Write-Host "WARNING: Required Azure modules (Az.Accounts, Az.Resources) are missing or failed to import. Please run 'Install-Module Az' to install them." -ForegroundColor Yellow
    exit 1
}

function Write-Utf8NoBom([string] $Path, [string] $Content)
{
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Write-ArchLucidResourcesJsonStream([string] $Path, $Resources)
{
    $writer = New-Object System.IO.StreamWriter($Path, $false, [System.Text.UTF8Encoding]::new($false))

    try {
        $writer.Write('[')
        $first = $true

        foreach ($resource in @($Resources)) {
            if (-not $first) {
                $writer.Write(',')
            }

            $first = $false
            $json = $resource | ConvertTo-Json -Depth 10 -Compress
            $writer.Write($json)
        }

        $writer.Write(']')
    }
    finally {
        $writer.Dispose()
    }
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
. (Join-Path (Split-Path -Parent $PSCommandPath) 'ArchLucid.ExtractorTelemetry.helpers.ps1')

function Get-ArchLucidExtractorInventoryResources
{
    param(
        [Parameter(Mandatory = $true)]
        $Telemetry,

        [string] $SubscriptionId,

        [string] $ManagementGroupId,

        [string] $ResourceGroupScope
    )

    [System.Diagnostics.Stopwatch]$stepWatch = [System.Diagnostics.Stopwatch]::StartNew()

    try
    {
        [object[]]$collected = @()

        if (-not ([string]::IsNullOrWhiteSpace($ManagementGroupId)))
        {
            if (-not (Get-Module -ListAvailable -Name Az.ResourceGraph))
            {
                throw "Az.ResourceGraph module is required for -ManagementGroupId. Install: Install-Module Az -Scope CurrentUser"
            }

            $collected = @(Get-ArchLucidAzureResourcesViaResourceGraphManagementGroup `
                -ManagementGroupId $ManagementGroupId `
                -ResourceGroupScope $ResourceGroupScope)
        }
        elseif (Get-Module -ListAvailable -Name Az.ResourceGraph)
        {
            $collected = @(Get-ArchLucidAzureResourcesViaResourceGraph `
                -SubscriptionId $SubscriptionId `
                -ResourceGroupScope $ResourceGroupScope)
        }
        elseif ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
        {
            $collected = @(Get-AzResource -Verbose:$false | ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ })
        }
        else
        {
            $collected = @(
                Get-AzResource -ResourceGroupName $ResourceGroupScope -Verbose:$false |
                    ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ }
            )
        }

        Complete-ArchLucidExtractorStep `
            -Telemetry $Telemetry `
            -Step Inventory `
            -Outcome Succeeded `
            -Stopwatch $stepWatch `
            -Context @{ resourceCount = $collected.Count }

        return @($collected)
    }
    catch
    {
        [string]$primaryFailure = "$( $_.Exception.Message )".Trim()

        [bool]$canFallbackToArm =
            ([string]::IsNullOrWhiteSpace($ManagementGroupId)) -and
            (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))

        if (-not ($canFallbackToArm))
        {
            Write-ArchLucidExtractorFatal `
                -Telemetry $Telemetry `
                -Step Inventory `
                -Stopwatch $stepWatch `
                -Message ("Inventory collection failed for scope '{0}'. {1}" -f $scopeDescriptor, $primaryFailure) `
                -Context @{ scope = $scopeDescriptor }

            throw
        }

        Add-ArchLucidExtractorWarning `
            -Telemetry $Telemetry `
            -Step Inventory `
            -Message ("Primary inventory path failed; retrying with Get-AzResource. {0}" -f $primaryFailure) `
            -Context @{ subscriptionId = $SubscriptionId; resourceGroup = $ResourceGroupScope }

        [System.Diagnostics.Stopwatch]$fallbackWatch = [System.Diagnostics.Stopwatch]::StartNew()

        try
        {
            [object[]]$fallbackCollected = @()

            if ([string]::IsNullOrWhiteSpace($ResourceGroupScope))
            {
                $fallbackCollected = @(Get-AzResource -Verbose:$false | ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ })
            }
            else
            {
                $fallbackCollected = @(
                    Get-AzResource -ResourceGroupName $ResourceGroupScope -Verbose:$false |
                        ForEach-Object { New-ArchLucidCollectedArmResourceRecord $_ }
                )
            }

            Complete-ArchLucidExtractorStep `
                -Telemetry $Telemetry `
                -Step Inventory `
                -Outcome SucceededWithFallback `
                -Stopwatch $fallbackWatch `
                -Detail "Resource Graph or paginated inventory failed; used Get-AzResource fallback." `
                -Context @{ resourceCount = $fallbackCollected.Count }

            return @($fallbackCollected)
        }
        catch
        {
            [string]$fallbackFailure = "$( $_.Exception.Message )".Trim()

            Write-ArchLucidExtractorFatal `
                -Telemetry $Telemetry `
                -Step Inventory `
                -Stopwatch $fallbackWatch `
                -Message ("Inventory collection failed after Get-AzResource fallback. Ensure Reader at subscription scope and retry Connect-AzAccount. {0}" -f $fallbackFailure) `
                -Context @{ subscriptionId = $SubscriptionId; resourceGroup = $ResourceGroupScope }

            throw
        }
    }
}

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
    Write-Host "Resource counts by provider namespace (preview):" -ForegroundColor Yellow
    try
    {
        if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
        {
            $null = Get-AzSubscription -SubscriptionId $SubscriptionId -ErrorAction Stop
            Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
        }

        if (Get-Module -ListAvailable -Name Az.ResourceGraph)
        {
            Import-Module Az.ResourceGraph -ErrorAction Stop
            [string]$countQuery = "Resources | summarize Count=count() by type | order by Count desc"
            if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
            {
                [string]$rg = "$ResourceGroupScope".Trim()
                $countQuery = "Resources | where resourceGroup =~ '$rg' | summarize Count=count() by type | order by Count desc"
            }

            [object]$summary = Search-AzGraph -Query $countQuery -Subscription $SubscriptionId -First 1000
            foreach ($row in @(Get-ArchLucidResourceGraphPageDataArray $summary))
            {
                Write-Host ("  {0,-60} {1,8}" -f $row.type, $row.Count)
            }
        }
        else
        {
            Write-Host "  (Install Az.ResourceGraph for per-type counts in dry run.)" -ForegroundColor DarkYellow
        }
    }
    catch
    {
        Write-Host "  (Could not enumerate resource counts: $_)" -ForegroundColor DarkYellow
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

$extractionStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$telemetry = New-ArchLucidExtractorTelemetryContext

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

if (-not ([string]::IsNullOrWhiteSpace($SubscriptionId)))
{
    [System.Diagnostics.Stopwatch]$contextWatch = [System.Diagnostics.Stopwatch]::StartNew()

    try
    {
        $null = Get-AzSubscription -SubscriptionId $SubscriptionId -ErrorAction Stop
        Set-AzContext -SubscriptionId $SubscriptionId | Out-Null

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step SubscriptionContext `
            -Outcome Succeeded `
            -Stopwatch $contextWatch `
            -Context @{ subscriptionId = $SubscriptionId }
    }
    catch
    {
        [string]$authFailure = "$( $_.Exception.Message )".Trim()

        Write-ArchLucidExtractorFatal `
            -Telemetry $telemetry `
            -Step SubscriptionContext `
            -Stopwatch $contextWatch `
            -Message ("Unable to access subscription '{0}'. Run Connect-AzAccount and ensure Reader (or equivalent) RBAC at subscription scope. {1}" -f $SubscriptionId, $authFailure) `
            -Context @{ subscriptionId = $SubscriptionId }

        exit 1
    }
}

$scriptVersion = "0.3.3"
$schemaVersion = 1
$collectionTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$azProfile = Get-Module Az.Resources
$azModuleVersion = if ($azProfile) { $azProfile.Version.ToString() } else { "unknown" }

$switchesUsed = @()
if ($IncludeCost) { $switchesUsed += "IncludeCost" }
if ($IncludeAdvisor) { $switchesUsed += "IncludeAdvisor" }
if ($IncludeRetailPrices) { $switchesUsed += "IncludeRetailPrices" }

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDir))
{
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-azure-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $staging | Out-Null

try
{
    $resources = Get-ArchLucidExtractorInventoryResources `
        -Telemetry $telemetry `
        -SubscriptionId $SubscriptionId `
        -ManagementGroupId $ManagementGroupId `
        -ResourceGroupScope $ResourceGroupScope

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
        [System.Diagnostics.Stopwatch]$costWatch = [System.Diagnostics.Stopwatch]::StartNew()

        try
        {
            $manifest["actualCostSummary"] =
                $(Get-ArchLucidActualCostSummary -SubscriptionId $SubscriptionId)

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step ActualCostSummary `
                -Outcome $(if ($null -eq $manifest["actualCostSummary"]) { 'Skipped' } else { 'Succeeded' }) `
                -Stopwatch $costWatch `
                -Context @{ subscriptionId = $SubscriptionId }
        }
        catch
        {
            Add-ArchLucidExtractorWarning `
                -Telemetry $telemetry `
                -Step ActualCostSummary `
                -Message ("Cost summary collection failed; manifest.actualCostSummary will be null. {0}" -f $_.Exception.Message) `
                -Context @{ subscriptionId = $SubscriptionId }

            $manifest["actualCostSummary"] = $null

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step ActualCostSummary `
                -Outcome Skipped `
                -Stopwatch $costWatch `
                -Detail $_.Exception.Message `
                -Context @{ subscriptionId = $SubscriptionId }
        }
    }

    $extractionStopwatch.Stop()
    $manifest["extractionDurationSeconds"] = [Math]::Round($extractionStopwatch.Elapsed.TotalSeconds, 2)

    $manifestPath = Join-Path $staging "manifest.json"
    $resourcesPath = Join-Path $staging "resources.json"
    Write-ArchLucidResourcesJsonStream -Path $resourcesPath -Resources $resources

    $policyCompliancePath = Join-Path $staging "policy-compliance.json"

    if ($env:ARCHLUCID_EXTRACTOR_SKIP_POLICY_COMPLIANCE -eq '1')
    {
        $policyCompliance = [ordered]@{
            policyComplianceSchemaVersion = 1
            collectionTimestampUtc = $collectionTimestamp
            scope = $scopeDescriptor
            managementPlane = "AzurePolicyInsights"
            apiShape = "policyStates/latest/queryResults"
            readerNote = "Policy compliance collection skipped for automated tests."
            recordCount = 0
            records = @()
        }
    }
    else
    {
        [System.Diagnostics.Stopwatch]$policyComplianceWatch = [System.Diagnostics.Stopwatch]::StartNew()

        try
        {
            $policyCompliance = New-ArchLucidPolicyComplianceDocument `
                -SubscriptionId $SubscriptionId `
                -ScopeDescriptor $scopeDescriptor `
                -CollectionTimestampUtc $collectionTimestamp `
                -ResourceGroupScope $ResourceGroupScope `
                -PolicyComplianceSchemaVersion 1 `
                -PageSize 450

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step PolicyCompliance `
                -Outcome Succeeded `
                -Stopwatch $policyComplianceWatch `
                -Context @{ recordCount = $policyCompliance.recordCount }
        }
        catch
        {
            [string]$policyFailure = "$( $_.Exception.Message )".Trim()

            Add-ArchLucidExtractorWarning `
                -Telemetry $telemetry `
                -Step PolicyCompliance `
                -Message ("Policy compliance query failed; emitting empty policy-compliance.json. Assign Reader at subscription or resource-group scope. {0}" -f $policyFailure) `
                -Context @{ scope = $scopeDescriptor }

            $policyCompliance = New-ArchLucidEmptyPolicyComplianceDocument `
                -ScopeDescriptor $scopeDescriptor `
                -CollectionTimestampUtc $collectionTimestamp `
                -ReaderNote ("Policy compliance collection failed for this run. Empty records emitted so the ZIP remains uploadable. Details: {0}" -f $policyFailure)

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step PolicyCompliance `
                -Outcome Skipped `
                -Stopwatch $policyComplianceWatch `
                -Detail $policyFailure `
                -Context @{ scope = $scopeDescriptor }
        }
    }

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

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step PolicyDefinitions `
            -Outcome Succeeded `
            -Context @{
                definitionCount = $policyData.policyDefinitions.Count
                assignmentCount = $policyData.policyAssignments.Count
            }
    } catch {
        Add-ArchLucidExtractorWarning `
            -Telemetry $telemetry `
            -Step PolicyDefinitions `
            -Message ("Failed to collect policy definitions or assignments; policy.json will contain empty arrays. {0}" -f $_.Exception.Message) `
            -Context @{ scope = $scopeDescriptor }

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step PolicyDefinitions `
            -Outcome Skipped `
            -Detail $_.Exception.Message `
            -Context @{ scope = $scopeDescriptor }
    }

    $policyPath = Join-Path $staging "policy.json"
    Write-Utf8NoBom $policyPath ($policyData | ConvertTo-Json -Depth 10)

    $retailReadmeTail = ""

    if ($IncludeRetailPrices)
    {
        [System.Diagnostics.Stopwatch]$retailWatch = [System.Diagnostics.Stopwatch]::StartNew()

        try
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

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step RetailPrices `
                -Outcome Succeeded `
                -Stopwatch $retailWatch
        }
        catch
        {
            Add-ArchLucidExtractorWarning `
                -Telemetry $telemetry `
                -Step RetailPrices `
                -Message ("Retail price catalog collection failed; retail-prices.json omitted. {0}" -f $_.Exception.Message)

            Complete-ArchLucidExtractorStep `
                -Telemetry $telemetry `
                -Step RetailPrices `
                -Outcome Skipped `
                -Stopwatch $retailWatch `
                -Detail $_.Exception.Message
        }
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
Upload via POST /v1/azure-extractor/upload (ExecuteAuthority). Trust stance: docs/go-to-market/trust-center.md.
"@

    Write-Utf8NoBom (Join-Path $staging "README.txt") $readme

    if ($IncludeAdvisor)
    {
        Add-ArchLucidExtractorWarning `
            -Telemetry $telemetry `
            -Step Advisor `
            -Message "IncludeAdvisor is not yet implemented — extend when the Advisor exporter is wired."

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step Advisor `
            -Outcome Skipped `
            -Detail "IncludeAdvisor switch is reserved for a future exporter release."
    }

    $manifest["extractionTelemetry"] = Get-ArchLucidExtractorTelemetryForManifest -Telemetry $telemetry
    Write-Utf8NoBom $manifestPath ($manifest | ConvertTo-Json -Depth 12)

    [System.Diagnostics.Stopwatch]$zipWatch = [System.Diagnostics.Stopwatch]::StartNew()

    try
    {
        if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
        Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutputPath -CompressionLevel Optimal

        Complete-ArchLucidExtractorStep `
            -Telemetry $telemetry `
            -Step PackageWrite `
            -Outcome Succeeded `
            -Stopwatch $zipWatch `
            -Context @{ outputPath = $OutputPath; warningCount = $telemetry.warnings.Count }

        Write-ArchLucidExtractorEvent `
            -Step PackageWrite `
            -Level Info `
            -Message ("Extraction complete. ZIP written to {0}." -f $OutputPath) `
            -Context @{ warningCount = $telemetry.warnings.Count }
    }
    catch
    {
        Write-ArchLucidExtractorFatal `
            -Telemetry $telemetry `
            -Step PackageWrite `
            -Stopwatch $zipWatch `
            -Message ("Failed to write extractor ZIP to '{0}'. {1}" -f $OutputPath, $_.Exception.Message) `
            -Context @{ outputPath = $OutputPath }

        exit 1
    }
}
catch
{
    [string]$unexpectedFailure = "$( $_.Exception.Message )".Trim()

    if ($null -ne $telemetry)
    {
        Add-ArchLucidExtractorWarning `
            -Telemetry $telemetry `
            -Step Extraction `
            -Message ("Unexpected extractor failure: {0}" -f $unexpectedFailure) `
            -Context @{ scope = $scopeDescriptor }
    }

    Write-ArchLucidExtractorEvent `
        -Step Extraction `
        -Level Error `
        -Message $unexpectedFailure `
        -Context @{ scope = $scopeDescriptor }

    exit 1
}
finally
{
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}
