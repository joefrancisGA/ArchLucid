# ArchLucid — Retail Prices API helpers for Get-ArchLucidAzurePackage.ps1
# Calls https://prices.azure.com/ over HTTPS — no Azure RBAC / Cost scopes.

function Escape-ODataRetail([string]$Literal)
{
    return ($Literal -replace "'", "''")
}

function CollapsedArchLucidSku([string]$Text)
{
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
    return ([regex]::Replace($Text.Trim(), "[\s_]+", "")).ToLowerInvariant()
}

function Test-ArchLucidRetailConsumptionRow([object]$Row)
{
    $currency = "$( $Row.currencyCode )"

    if (-not ([string]::Equals($currency, "USD", [System.StringComparison]::OrdinalIgnoreCase)))
    {
        return $false
    }

    $ptype = "$( $Row.type )"

    if ($ptype.Contains("Reservation", [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $false
    }

    $meterTierVal = "$( $Row.meterTier )"

    if ($meterTierVal.Contains("Government", [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $false
    }

    $meterNameVal = "$( $Row.meterName )"

    if ($meterNameVal.Contains("Rsv", [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $false
    }

    $uom = "$( $Row.unitOfMeasure )"

    if ([string]::IsNullOrWhiteSpace($uom))
    {
        return $false
    }

    if ($uom.Contains("Hour", [System.StringComparison]::OrdinalIgnoreCase) -or
        $uom.Contains("hrs", [System.StringComparison]::OrdinalIgnoreCase))
    {
        return $true
    }

    return $uom.Contains("Month", [System.StringComparison]::OrdinalIgnoreCase) -or
        $uom.Contains("/Month", [System.StringComparison]::OrdinalIgnoreCase)
}

function Match-ArchLucidRetailSkuAgainstHints([Collections.Generic.HashSet[string]]$Hints, [object]$RetailRow)
{
    foreach ($want in @($Hints))
    {
        foreach ($candidate in @($RetailRow.skuName, $RetailRow.armSkuName))
        {
            $wc = CollapsedArchLucidSku("$want")
            $gc = CollapsedArchLucidSku("$candidate")

            if ([string]::IsNullOrWhiteSpace($wc) -or [string]::IsNullOrWhiteSpace($gc)) { continue }

            if ([string]::Equals($gc, $wc, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

            if ($gc.StartsWith($wc, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

            if ($wc.StartsWith($gc, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

            if (($wc.Length -gt 4) -and $gc.Contains($wc,
                    [System.StringComparison]::OrdinalIgnoreCase))
            {
                return $true
            }

        }

    }

    return $false
}

function Resolve-ArchLucidRetailCatalogServiceName([string]$ResourceType)
{
    switch ("$ResourceType".ToLowerInvariant())
    {
        "microsoft.web/serverfarms" {

            # Retail OData `serviceName` for compute plans.


            return "Azure App Service"

        }

        "microsoft.sql/servers/databases" {

            return "SQL Database"

        }

        # Aligns with InfrastructureCostPricingCatalog retail service name for VMs.
        "microsoft.compute/virtualmachines" {

            return "Virtual Machines"

        }

        # Aligns with InfrastructureCostPricingCatalog retail service name for blob-capable storage accounts.
        "microsoft.storage/storageaccounts" {

            return "Storage Accounts"

        }

        Default { return "" }

    }

}

function Get-ArchLucidInventoryVmSizeHint([Collections.IDictionary]$Row)
{
    if ($null -eq $Row) { return "" }

    if (-not ($Row.Contains("properties"))) { return "" }

    $props = $Row["properties"]

    if ($null -eq $props) { return "" }

    if ($props -is [Collections.IDictionary])
    {

        [Collections.IDictionary]$pd = $props

        if (-not ($pd.Contains("hardwareProfile"))) { return "" }

        $hp = $pd["hardwareProfile"]

        if ($null -eq $hp) { return "" }

        if ($hp -is [Collections.IDictionary])
        {

            [Collections.IDictionary]$hd = $hp

            if (-not ($hd.Contains("vmSize"))) { return "" }

            return "$( $hd['vmSize'] )".Trim()

        }

        try { return "$( $hp.vmSize )".Trim() } catch { return "" }

    }

    try { return "$( $props.hardwareProfile.vmSize )".Trim() } catch { return "" }

}

function Get-ArchLucidRetailInventorySkuHints([Collections.IDictionary]$Row)
{
    $list = [Collections.Generic.List[string]]::new()

    [string]$resourceType = ""

    if (($null -ne $Row) -and ($Row.Contains("resourceType")))
    {

        $resourceType = "$( $Row['resourceType'] )".Trim()

    }

    if (($null -eq $Row) -or (-not ($Row.Contains("sku"))))
    {

        # VMs often omit top-level `sku`; size lives under `properties.hardwareProfile.vmSize` (see package collector).

        if ([string]::Equals($resourceType, "Microsoft.Compute/virtualMachines",
                [System.StringComparison]::OrdinalIgnoreCase))
        {

            [string]$vmHint = Get-ArchLucidInventoryVmSizeHint $Row

            if (-not ([string]::IsNullOrWhiteSpace($vmHint))) { [void]$list.Add($vmHint) }

        }

        return $list.ToArray()

    }

    $skuObj = $Row["sku"]

    $name = ""

    $tier = ""

    $cap = ""

    if ($null -ne $skuObj)
    {

        if ($skuObj -is [Collections.IDictionary])
        {

            [Collections.IDictionary]$d = $skuObj

            foreach ($k in @("Name", "name"))
            {

                if (-not ($d.Contains($k))) { continue }

                $name = "$( $d[$k] )".Trim()

                break

            }

            foreach ($k in @("Tier", "tier"))
            {

                if (-not ($d.Contains($k))) { continue }

                $tier = "$( $d[$k] )".Trim()

                break

            }

            foreach ($k in @("Capacity", "capacity"))
            {

                if (-not ($d.Contains($k))) { continue }

                $cap = "$( $d[$k] )".Trim()

                break

            }

        }

        else
        {

            try { $name = "$( $skuObj.Name )".Trim() } catch {}

            try { $tier = "$( $skuObj.Tier )".Trim() } catch {}

            try { $cap = "$( $skuObj.Capacity )".Trim() } catch {}

        }

    }

    if (-not ([string]::IsNullOrWhiteSpace($name)))
    {

        [void]$list.Add($name)

        if ((-not ([string]::IsNullOrWhiteSpace($tier))) -and (-not ([string]::IsNullOrWhiteSpace($cap))))
        {

            [void]$list.Add("${tier}_${cap}")

        }

    }

    elseif ((-not ([string]::IsNullOrWhiteSpace($tier))) -and (-not ([string]::IsNullOrWhiteSpace($cap))))
    {

        [void]$list.Add("${tier}_${cap}")

    }

    elseif (-not ([string]::IsNullOrWhiteSpace($tier)))
    {

        [void]$list.Add($tier)

    }

    if ([string]::Equals($resourceType, "Microsoft.Compute/virtualMachines",
            [System.StringComparison]::OrdinalIgnoreCase))
    {

        [string]$vmHint = Get-ArchLucidInventoryVmSizeHint $Row

        if ((-not ([string]::IsNullOrWhiteSpace($vmHint))) -and (-not ($list.Contains($vmHint))))
        {

            [void]$list.Add($vmHint)

        }

    }

    return $list.ToArray()
}

function New-ArchLucidRetailPricesDocument(
    [AllowEmptyCollection()][object[]]$Inventory,
    [string]$QueryTimestampUtc,
    [string]$RetailApiVersion)
{

    [string]$authority = "https://prices.azure.com/"

    [int]$maxPages = 48

    $skipped = [Collections.Generic.List[object]]::new()

    $probes = @{ }

    $catalogRows = [Collections.Generic.List[object]]::new()

    $duplicateMeters = @{ }

    foreach ($rec in @($Inventory))
    {

        if ($null -eq $rec) { continue }

        [Collections.IDictionary]$d = $rec

        $svc = Resolve-ArchLucidRetailCatalogServiceName("$($d["resourceType"])")

        if ([string]::IsNullOrWhiteSpace($svc)) { continue }

        $loc = "$($d["location"])".Trim().ToLowerInvariant()

        if ([string]::IsNullOrWhiteSpace($loc) -or [string]::Equals($loc,
                "global",
                [System.StringComparison]::OrdinalIgnoreCase))

        {

            [void]$skipped.Add([ordered]@{
                    resourceId   = "$( $d["resourceId"] )"
                    resourceType = "$( $d["resourceType"] )"

                    reason       = "location_not_supported_for_retail_filter"

                })

            continue

        }

        [string]$probeKey = "${svc}|${loc}"

        if (-not ($probes.ContainsKey($probeKey)))

        {

            $probes[$probeKey] = [ordered]@{
                retailServiceName = $svc
                armRegionName     = $loc
                skuHints          =
                    [Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
                resourceIds       = [Collections.Generic.List[string]]::new()

            }

        }

        $pb = $probes[$probeKey]

        [string]$rid = "$($d["resourceId"])".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($rid)))
        {

            [void]$pb.resourceIds.Add($rid)

        }

        $hintStrings = @(Get-ArchLucidRetailInventorySkuHints $d)

        if ($hintStrings.Count -eq 0)

        {

            [void]$skipped.Add([ordered]@{

                    resourceId   = "$( $d["resourceId"] )"

                    resourceType = "$( $d["resourceType"] )"

                    resourceName = "$( $d["name"] )"

                    reason       = "missing_inventory_sku_for_matching"

                })

        }

        foreach ($h in $hintStrings)
        {

            $c = CollapsedArchLucidSku($h)

            if (-not ([string]::IsNullOrWhiteSpace($c)))

            {

                [void]$pb.skuHints.Add($c)

            }

        }

    }

    foreach ($pkey in @($probes.Keys | Sort-Object))
    {

        $probe = $probes[$pkey]

        if ($probe.skuHints.Count -eq 0) { continue }

        $skuSet = $probe.skuHints

        $filterInner =
            "serviceName eq '$( Escape-ODataRetail $probe.retailServiceName)' and armRegionName eq '$( Escape-ODataRetail $probe.armRegionName)' and priceType eq 'Consumption'"

        [string]$escaped = [Uri]::EscapeDataString($filterInner)

        [string]$cursor =
            "${authority}api/retail/prices?api-version=$([Uri]::EscapeDataString($RetailApiVersion))&%24filter=$escaped"

        $pageIdx = 0

        while ((-not ([string]::IsNullOrWhiteSpace($cursor))) -and ($pageIdx -lt $maxPages))
        {

            [object]$page = $null

            try

            {

                $page = Invoke-RestMethod `
                    -Uri $cursor `
                    -MaximumRetryCount 3 `
                    -Headers @{ Accept = "application/json" }


            }


            catch

            {

                throw "Retail Prices API request failed for '$($probe.retailServiceName)' in '$($probe.armRegionName)': $($_.Exception.Message)"

            }



            foreach ($it in @($page.Items))

            {


                if (-not (Test-ArchLucidRetailConsumptionRow $it)) { continue }

                if (-not (Match-ArchLucidRetailSkuAgainstHints $skuSet $it)) { continue }

                [string]$sig =
                    "$( $it.meterId )|$( $it.effectiveStartDate )|$( $it.armRegionName )|$( $it.skuName )|$( $it.meterName )"

                if ($duplicateMeters.ContainsKey($sig)) { continue }

                $duplicateMeters[$sig] = $true

                $wrapped = [ordered]@{

                    retailServiceProbe          = $probe.retailServiceName

                    armRegionProbe              = $probe.armRegionName


                    matchedInventoryResourceIds =
                        @( $probe.resourceIds )
                    skuHintsCollapsedConsidered = @( ($probe.skuHints | Sort-Object) )
                    catalogItem                 = $it

                }

                [void]$catalogRows.Add([pscustomobject]$wrapped)

            }

            [string]$nextUri = ""

            if (($null -ne $page) -and ($page.PSObject.Properties.Name -contains "NextPageLink"))
            {

                $nextUri = "$($page.NextPageLink)".Trim()

            }



            if (([string]::IsNullOrWhiteSpace($nextUri)) -and ($null -ne $page) -and



                    ($page.PSObject.Properties.Name -contains "nextPageLink"))



            {



                $nextUri = "$($page.nextPageLink)".Trim()


            }



            $cursor = $nextUri



            $pageIdx++


        }

    }




    $probeDiag = [Collections.Generic.List[object]]::new()



    foreach ($pk in @($probes.Keys | Sort-Object))



    {



        $pv = $probes[$pk]



        [void]$probeDiag.Add([pscustomobject]([ordered]@{

                    retailServiceName = $pv.retailServiceName



                    armRegionName     = $pv.armRegionName



                    skuHintsCollapsed = @( ($pv.skuHints | Sort-Object) )


                    resourceIds       = @( $pv.resourceIds )


                }))



    }




    return [ordered]@{

        schemaVersion            = 1


        retailPricesApiAuthority = $authority


        apiVersion               = $RetailApiVersion


        queryTimestampUtc        = $QueryTimestampUtc



        probes               = @( $probeDiag )


        skippedInventoryRows = @( $skipped )


        catalogRows          = @( $catalogRows )


    }


}

