# IE-RF-02: typed ARG relationship projections for network-associations.json

function ConvertFrom-ArchLucidArgJsonArray([string] $Json)
{
    if ([string]::IsNullOrWhiteSpace($Json))
    {
        return @()
    }

    try
    {
        return @((ConvertFrom-Json -InputObject $Json -ErrorAction Stop))
    }
    catch
    {
        return @()
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromVmRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $VmResourceId,
        [object] $NetworkInterfacesJson
    )

    foreach ($nic in @(ConvertFrom-ArchLucidArgJsonArray "$( $NetworkInterfacesJson )"))
    {
        [string]$nicId = "$( $nic.id )".Trim()

        if ([string]::IsNullOrWhiteSpace($nicId)) { continue }

        Add-ArchLucidNetworkAssociationRow `
            -Rows $Rows `
            -Seen $Seen `
            -FromResourceId $VmResourceId `
            -ToResourceId $nicId `
            -AssociationType 'vmToNic'
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromNicRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $NicResourceId,
        [object] $IpConfigurationsJson,
        [string] $NetworkSecurityGroupId = $null
    )

    foreach ($ipConfig in @(ConvertFrom-ArchLucidArgJsonArray "$( $IpConfigurationsJson )"))
    {
        [string]$subnetId = "$( $ipConfig.properties.subnet.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $NicResourceId `
                -ToResourceId $subnetId `
                -AssociationType 'nicToSubnet'
        }

        [string]$publicIpId = "$( $ipConfig.properties.publicIPAddress.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($publicIpId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $publicIpId `
                -ToResourceId $NicResourceId `
                -AssociationType 'publicIpToNic'
        }
    }

    if (-not ([string]::IsNullOrWhiteSpace($NetworkSecurityGroupId)))
    {
        Add-ArchLucidNetworkAssociationRow `
            -Rows $Rows `
            -Seen $Seen `
            -FromResourceId $NicResourceId `
            -ToResourceId $NetworkSecurityGroupId `
            -AssociationType 'nicToNsg'
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $VNetResourceId,
        [object] $SubnetsJson,
        [object] $PeeringsJson
    )

    foreach ($subnet in @(ConvertFrom-ArchLucidArgJsonArray "$( $SubnetsJson )"))
    {
        [string]$subnetId = "$( $subnet.id )".Trim()

        if ([string]::IsNullOrWhiteSpace($subnetId))
        {
            [string]$subnetName = "$( $subnet.name )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($subnetName)))
            {
                $subnetId = "$VNetResourceId/subnets/$subnetName"
            }
        }

        [string]$nsgId = "$( $subnet.properties.networkSecurityGroup.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)) -and -not ([string]::IsNullOrWhiteSpace($nsgId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $subnetId `
                -ToResourceId $nsgId `
                -AssociationType 'subnetToNsg'
        }

        [string]$routeTableId = "$( $subnet.properties.routeTable.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)) -and -not ([string]::IsNullOrWhiteSpace($routeTableId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $subnetId `
                -ToResourceId $routeTableId `
                -AssociationType 'subnetToRouteTable'
        }
    }

    foreach ($peering in @(ConvertFrom-ArchLucidArgJsonArray "$( $PeeringsJson )"))
    {
        [string]$remoteVnetId = "$( $peering.properties.remoteVirtualNetwork.id )".Trim()

        if (-not ([string]::IsNullOrWhiteSpace($remoteVnetId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $VNetResourceId `
                -ToResourceId $remoteVnetId `
                -AssociationType 'vnetPeering'
        }
    }
}

function Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $ResourceGroupScope = ""
    )

    if (-not (Get-Module -ListAvailable -Name Az.ResourceGraph))
    {
        return @()
    }

    Import-Module Az.ResourceGraph -ErrorAction Stop

    [System.Collections.ArrayList]$rows = [System.Collections.ArrayList]::new()
    [hashtable]$seen = @{}

    [string]$rgFilter = ""

    if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
    {
        [string]$rg = "$ResourceGroupScope".Trim()
        $rgFilter = "| where resourceGroup =~ '$rg'"
    }

    [string[]]$queries = @(
        "Resources | where type =~ 'microsoft.compute/virtualmachines' $rgFilter | project id, networkInterfaces = properties.networkProfile.networkInterfaces",
        "Resources | where type =~ 'microsoft.network/networkinterfaces' $rgFilter | project id, ipConfigurations = properties.ipConfigurations, networkSecurityGroupId = properties.networkSecurityGroup.id",
        "Resources | where type =~ 'microsoft.network/virtualnetworks' $rgFilter | project id, subnets = properties.subnets, peerings = properties.virtualNetworkPeerings"
    )

    foreach ($query in $queries)
    {
        try
        {
            [object]$page = Search-AzGraph -Query $query -Subscription $SubscriptionId -First 1000

            foreach ($row in @(Get-ArchLucidResourceGraphPageDataArray $page))
            {
                [string]$resourceId = "$( $row.id )".Trim()
                [string]$resourceType = "$( $row.type )".Trim()

                if ([string]::IsNullOrWhiteSpace($resourceId)) { continue }

                if ($resourceType -like '*virtualmachines*')
                {
                    Add-ArchLucidArgNetworkAssociationRowsFromVmRecord `
                        -Rows $rows `
                        -Seen $seen `
                        -VmResourceId $resourceId `
                        -NetworkInterfacesJson $row.networkInterfaces
                }

                if ($resourceType -like '*networkinterfaces*')
                {
                    Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
                        -Rows $rows `
                        -Seen $seen `
                        -NicResourceId $resourceId `
                        -IpConfigurationsJson $row.ipConfigurations `
                        -NetworkSecurityGroupId "$( $row.networkSecurityGroupId )".Trim()
                }

                if ($resourceType -like '*virtualnetworks*')
                {
                    Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord `
                        -Rows $rows `
                        -Seen $seen `
                        -VNetResourceId $resourceId `
                        -SubnetsJson $row.subnets `
                        -PeeringsJson $row.peerings
                }
            }
        }
        catch
        {
        }
    }

    return @($rows.ToArray())
}
