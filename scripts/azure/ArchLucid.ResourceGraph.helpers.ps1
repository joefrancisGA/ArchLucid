# ArchLucid - Azure Resource Graph inventory helpers for Get-ArchLucidAzurePackage.ps1

function Get-ArchLucidResourceGraphPageSkipToken([PSObject] $ParsedPage)
{
    if ($null -eq $ParsedPage)
    {
        return $null
    }

    foreach ($prop in @( $ParsedPage.psobject.Properties ))
    {
        [string]$name = "$( $prop.Name )".Trim()

        if (-not ($name.Equals('$skipToken', [System.StringComparison]::OrdinalIgnoreCase)))
        {
            continue
        }

        [string]$value = "$( $prop.Value )"

        if (-not ([string]::IsNullOrWhiteSpace($value)))
        {
            return $value
        }
    }

    return $null
}

function Get-ArchLucidResourceGraphPageDataArray([PSObject] $ParsedPage)
{
    if (($null -eq $ParsedPage) -or (-not ($ParsedPage.psobject.Properties['data'])))
    {
        return @()
    }

    return @($ParsedPage.data)
}

function New-ArchLucidCollectedResourceGraphRecord([PSObject] $Row)
{
    if ($null -eq $Row)
    {
        return $null
    }

    return [ordered]@{
        resourceType = $Row.type
        resourceId = $Row.id
        name = $Row.name
        location = $Row.location
        sku = $Row.sku
        tags = $Row.tags
        properties = $Row.properties
    }
}

function Get-ArchLucidAzureResourcesViaResourceGraph(
    [Parameter(Mandatory = $true)]
    [string] $SubscriptionId,

    [string] $ResourceGroupScope = "",

    [ValidateRange(100, 1000)]
    [int] $PageSize = 1000)
{
    if (-not (Get-Module -ListAvailable -Name Az.ResourceGraph))
    {
        throw "Az.ResourceGraph module is required for complete inventory pagination. Install: Install-Module Az -Scope CurrentUser"
    }

    Import-Module Az.ResourceGraph -ErrorAction Stop

    [string]$query = "Resources | project id, name, type, location, tags, sku, properties"

    if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
    {
        [string]$rg = "$ResourceGroupScope".Trim()
        $query = "Resources | where resourceGroup =~ '$rg' | project id, name, type, location, tags, sku, properties"
    }

    [System.Collections.Generic.List[object]]$accumulator = [System.Collections.Generic.List[object]]::new()
    [string]$skipToken = $null

    do
    {
        [hashtable]$searchParams = @{
            Query = $query
            Subscription = $SubscriptionId
            First = $PageSize
        }

        if (-not ([string]::IsNullOrWhiteSpace($skipToken)))
        {
            $searchParams['SkipToken'] = $skipToken
        }

        [object]$page = Search-AzGraph @searchParams

        foreach ($row in @(Get-ArchLucidResourceGraphPageDataArray $page))
        {
            [object]$record = New-ArchLucidCollectedResourceGraphRecord $row

            if ($null -ne $record)
            {
                [void]$accumulator.Add($record)
            }
        }

        $skipToken = Get-ArchLucidResourceGraphPageSkipToken $page
    }
    while (-not ([string]::IsNullOrWhiteSpace($skipToken)))

    return @($accumulator)
}
