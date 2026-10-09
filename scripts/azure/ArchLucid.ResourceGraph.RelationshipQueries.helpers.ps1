# IE-RF-02: typed ARG relationship projections for network-associations.json

function Get-ArchLucidArgNestedProperty([object] $Owner, [string] $PropertyName)
{
    if ($null -eq $Owner)
    {
        return $null
    }

    [System.Management.Automation.PSPropertyInfo]$prop = $Owner.psobject.Properties[$PropertyName]

    if ($null -eq $prop)
    {
        return $null
    }

    return $prop.Value
}

function ConvertFrom-ArchLucidArgJsonArray([object] $Value)
{
    if ($null -eq $Value)
    {
        return @()
    }

    if ($Value -is [string])
    {
        if ([string]::IsNullOrWhiteSpace($Value))
        {
            return @()
        }

        try
        {
            return @((ConvertFrom-Json -InputObject $Value -ErrorAction Stop))
        }
        catch
        {
            return @()
        }
    }

    if ($Value -is [System.Collections.IEnumerable])
    {
        [System.Collections.ArrayList]$items = [System.Collections.ArrayList]::new()

        foreach ($item in $Value)
        {
            if ($null -ne $item)
            {
                [void]$items.Add($item)
            }
        }

        return @($items.ToArray())
    }

    return @($Value)
}

function Add-ArchLucidArgNetworkAssociationRowsFromVmRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $VmResourceId,
        [object] $NetworkInterfacesJson
    )

    foreach ($nic in @(ConvertFrom-ArchLucidArgJsonArray $NetworkInterfacesJson))
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
        [string] $NetworkSecurityGroupId = $null,
        [System.Collections.IList] $PublicIpIpConfigurationFacts = $null
    )

    foreach ($ipConfig in @(ConvertFrom-ArchLucidArgJsonArray $IpConfigurationsJson))
    {
        [string]$subnetId = ''
        [object]$subnetRef = Get-ArchLucidArgNestedProperty $ipConfig.properties 'subnet'

        if ($null -ne $subnetRef)
        {
            $subnetId = "$( $subnetRef.id )".Trim()
        }

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $NicResourceId `
                -ToResourceId $subnetId `
                -AssociationType 'nicToSubnet'
        }

        [string]$publicIpId = ''
        [object]$publicIpRef = Get-ArchLucidArgNestedProperty $ipConfig.properties 'publicIPAddress'

        if ($null -ne $publicIpRef)
        {
            $publicIpId = "$( $publicIpRef.id )".Trim()
        }

        if (-not ([string]::IsNullOrWhiteSpace($publicIpId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $publicIpId `
                -ToResourceId $NicResourceId `
                -AssociationType 'publicIpToNic'

            if ($null -ne $PublicIpIpConfigurationFacts)
            {
                [string]$ipConfigName = "$(Get-ArchLucidArgNestedProperty $ipConfig 'name')".Trim()

                if (-not ([string]::IsNullOrWhiteSpace($ipConfigName)))
                {
                    [void]$PublicIpIpConfigurationFacts.Add([ordered]@{
                            resourceId = $publicIpId
                            ipConfigurationId = "$NicResourceId/ipConfigurations/$ipConfigName"
                        })
                }
            }
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

function Add-ArchLucidArgNetworkAssociationRowsFromPublicIpRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $PublicIpResourceId,
        [object] $IpConfigurationJson,
        [string] $NatGatewayId = "",
        [System.Collections.IList] $PublicIpIpConfigurationFacts = $null
    )

    [object]$ipConfiguration = $IpConfigurationJson
    [string]$ipConfigurationId = ''

    if ($null -ne $ipConfiguration)
    {
        if ($ipConfiguration -is [string])
        {
            [string]$ipConfigurationText = $ipConfiguration.Trim()

            if (-not [string]::IsNullOrWhiteSpace($ipConfigurationText))
            {
                if ($ipConfigurationText.StartsWith('/') -and
                    $ipConfigurationText.Contains('ipConfigurations', [System.StringComparison]::OrdinalIgnoreCase))
                {
                    $ipConfigurationId = $ipConfigurationText
                }
                else
                {
                    try
                    {
                        $ipConfiguration = ConvertFrom-Json -InputObject $ipConfigurationText -ErrorAction Stop
                    }
                    catch
                    {
                        $ipConfiguration = $null
                    }
                }
            }
        }

        if ($ipConfiguration -is [string] -and [string]::IsNullOrWhiteSpace($ipConfigurationId))
        {
            $ipConfigurationId = "$ipConfiguration".Trim()
        }

        if ([string]::IsNullOrWhiteSpace($ipConfigurationId))
        {
            [object]$ipConfigurationIdRef = Get-ArchLucidArgNestedProperty $ipConfiguration 'id'
            $ipConfigurationId = "$ipConfigurationIdRef".Trim()
        }
    }

    [string]$associatedResourceId = Resolve-ArchLucidAssociatedResourceFromIpConfiguration -IpConfigurationId $ipConfigurationId

    if ([string]::IsNullOrWhiteSpace($associatedResourceId) -and -not [string]::IsNullOrWhiteSpace($NatGatewayId))
    {
        $associatedResourceId = $NatGatewayId.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($associatedResourceId))
    {
        Add-ArchLucidNetworkAssociationRow `
            -Rows $Rows `
            -Seen $Seen `
            -FromResourceId $PublicIpResourceId `
            -ToResourceId $associatedResourceId `
            -AssociationType 'publicIpToNic'
    }

    if ($null -ne $PublicIpIpConfigurationFacts -and
        (-not [string]::IsNullOrWhiteSpace($ipConfigurationId) -or
         -not [string]::IsNullOrWhiteSpace($NatGatewayId)))
    {
        [void]$PublicIpIpConfigurationFacts.Add([ordered]@{
                resourceId = $PublicIpResourceId
                ipConfigurationId = $ipConfigurationId
                natGatewayId = $NatGatewayId
            })
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromBastionRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $BastionResourceId,
        [object] $IpConfigurationsJson
    )

    foreach ($ipConfig in @(ConvertFrom-ArchLucidArgJsonArray $IpConfigurationsJson))
    {
        [string]$subnetId = ''
        [object]$subnetRef = Get-ArchLucidArgNestedProperty $ipConfig.properties 'subnet'

        if ($null -ne $subnetRef)
        {
            $subnetId = "$( $subnetRef.id )".Trim()
        }

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $BastionResourceId `
                -ToResourceId $subnetId `
                -AssociationType 'bastionToSubnet'
        }
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $FirewallResourceId,
        [object] $IpConfigurationsJson,
        [object] $ManagementIpConfiguration = $null,
        [System.Collections.IList] $FirewallPrivateIpFacts = $null,
        [System.Collections.IList] $FirewallSubnetFacts = $null
    )

    if ($null -eq $FirewallPrivateIpFacts) { $FirewallPrivateIpFacts = [System.Collections.ArrayList]::new() }
    if ($null -eq $FirewallSubnetFacts) { $FirewallSubnetFacts = [System.Collections.ArrayList]::new() }

    foreach ($ipConfig in @(ConvertFrom-ArchLucidArgJsonArray $IpConfigurationsJson))
    {
        [object]$ipConfigProperties = Get-ArchLucidArgNestedProperty $ipConfig 'properties'
        [object]$subnetRef = Get-ArchLucidArgNestedProperty $ipConfigProperties 'subnet'
        [string]$subnetId = "$(Get-ArchLucidArgNestedProperty $subnetRef 'id')".Trim()
        [string]$privateIpAddress = "$(Get-ArchLucidArgNestedProperty $ipConfigProperties 'privateIPAddress')".Trim()

        if (-not [string]::IsNullOrWhiteSpace($subnetId))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $FirewallResourceId `
                -ToResourceId $subnetId `
                -AssociationType 'firewallToSubnet'

            [void]$FirewallSubnetFacts.Add([ordered]@{
                resourceId = $FirewallResourceId
                subnetId = $subnetId
                propertyName = 'ipConfiguration'
            })
        }

        if (-not [string]::IsNullOrWhiteSpace($privateIpAddress))
        {
            [void]$FirewallPrivateIpFacts.Add([ordered]@{
                    resourceId = $FirewallResourceId
                    privateIPAddress = $privateIpAddress
                })
        }
    }

    [object]$managementProperties = Get-ArchLucidArgNestedProperty $ManagementIpConfiguration 'properties'
    [object]$managementSubnetRef = Get-ArchLucidArgNestedProperty $managementProperties 'subnet'
    [string]$managementSubnetId = "$(Get-ArchLucidArgNestedProperty $managementSubnetRef 'id')".Trim()

    if (-not [string]::IsNullOrWhiteSpace($managementSubnetId))
    {
        [void]$FirewallSubnetFacts.Add([ordered]@{
            resourceId = $FirewallResourceId
            subnetId = $managementSubnetId
            propertyName = 'managementIpConfiguration'
        })
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromRouteTableRecord
{
    param(
        [System.Collections.IList] $RouteTableFacts,
        [string] $RouteTableResourceId,
        [object] $RoutesJson
    )

    [void]$RouteTableFacts.Add([ordered]@{
            resourceId = $RouteTableResourceId
            routes = $RoutesJson
        })
}

function Add-ArchLucidArgNetworkAssociationRowsFromAppServiceRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $AppServiceResourceId,
        [string] $VirtualNetworkSubnetId
    )

    [string]$subnetId = "$VirtualNetworkSubnetId".Trim()

    if ([string]::IsNullOrWhiteSpace($subnetId))
    {
        return
    }

    Add-ArchLucidNetworkAssociationRow `
        -Rows $Rows `
        -Seen $Seen `
        -FromResourceId $AppServiceResourceId `
        -ToResourceId $subnetId `
        -AssociationType 'appServiceToSubnet'
}

function Add-ArchLucidArgFirewallRoutedSubnetRows
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [System.Collections.IList] $FirewallPrivateIpFacts,
        [System.Collections.IList] $RouteTableFacts
    )

    foreach ($firewallFact in $FirewallPrivateIpFacts)
    {
        [string]$firewallResourceId = "$($firewallFact.resourceId)".Trim()
        [string]$privateIpAddress = "$($firewallFact.privateIPAddress)".Trim()

        if ([string]::IsNullOrWhiteSpace($firewallResourceId) `
            -or [string]::IsNullOrWhiteSpace($privateIpAddress))
        {
            continue
        }

        foreach ($routeTableFact in $RouteTableFacts)
        {
            [string]$routeTableResourceId = "$($routeTableFact.resourceId)".Trim()

            if ([string]::IsNullOrWhiteSpace($routeTableResourceId))
            {
                continue
            }

            $routeTableSubnetRows = @(
                $Rows | Where-Object {
                    $_.associationType -eq 'subnetToRouteTable' `
                        -and $_.toResourceId -eq $routeTableResourceId
                }
            )

            foreach ($subnetRow in $routeTableSubnetRows)
            {
                foreach ($route in @(ConvertFrom-ArchLucidArgJsonArray $routeTableFact.routes))
                {
                    [object]$routeProperties = Get-ArchLucidArgNestedProperty $route 'properties'
                    [string]$nextHopType = "$(Get-ArchLucidArgNestedProperty $routeProperties 'nextHopType')".Trim()
                    [string]$nextHopIpAddress = "$(Get-ArchLucidArgNestedProperty $routeProperties 'nextHopIpAddress')".Trim()

                    if (-not $nextHopType.Equals('VirtualAppliance', [System.StringComparison]::OrdinalIgnoreCase) `
                        -or -not $nextHopIpAddress.Equals($privateIpAddress, [System.StringComparison]::OrdinalIgnoreCase))
                    {
                        continue
                    }

                    Add-ArchLucidNetworkAssociationRow `
                        -Rows $Rows `
                        -Seen $Seen `
                        -FromResourceId $firewallResourceId `
                        -ToResourceId "$($subnetRow.fromResourceId)".Trim() `
                        -AssociationType 'firewallToSubnet'
                }
            }
        }
    }
}

function Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $VNetResourceId,
        [object] $SubnetsJson,
        [object] $PeeringsJson,
        [System.Collections.IList] $VirtualNetworkSubnetFacts = $null
    )

    if ($null -eq $VirtualNetworkSubnetFacts) { $VirtualNetworkSubnetFacts = [System.Collections.ArrayList]::new() }

    [void]$VirtualNetworkSubnetFacts.Add([ordered]@{
        resourceId = $VNetResourceId
        subnets = $SubnetsJson
    })

    foreach ($subnet in @(ConvertFrom-ArchLucidArgJsonArray $SubnetsJson))
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

        [string]$nsgId = ''
        [object]$nsgRef = Get-ArchLucidArgNestedProperty $subnet.properties 'networkSecurityGroup'

        if ($null -ne $nsgRef)
        {
            $nsgId = "$( $nsgRef.id )".Trim()
        }

        if (-not ([string]::IsNullOrWhiteSpace($subnetId)) -and -not ([string]::IsNullOrWhiteSpace($nsgId)))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $subnetId `
                -ToResourceId $nsgId `
                -AssociationType 'subnetToNsg'
        }

        [string]$routeTableId = ''
        [object]$routeTableRef = Get-ArchLucidArgNestedProperty $subnet.properties 'routeTable'

        if ($null -ne $routeTableRef)
        {
            $routeTableId = "$( $routeTableRef.id )".Trim()
        }

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

    foreach ($peering in @(ConvertFrom-ArchLucidArgJsonArray $PeeringsJson))
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

function Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord
{
    param(
        [System.Collections.IList] $Rows,
        [hashtable] $Seen,
        [string] $PrivateEndpointResourceId,
        [string] $SubnetId,
        [object] $NetworkInterfacesJson,
        [object] $PrivateLinkServiceConnectionsJson,
        [object] $ManualPrivateLinkServiceConnectionsJson
    )

    [string]$normalizedSubnetId = "$SubnetId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($normalizedSubnetId))
    {
        Add-ArchLucidNetworkAssociationRow `
            -Rows $Rows `
            -Seen $Seen `
            -FromResourceId $PrivateEndpointResourceId `
            -ToResourceId $normalizedSubnetId `
            -AssociationType 'peToSubnet'
    }

    foreach ($networkInterface in @(ConvertFrom-ArchLucidArgJsonArray $NetworkInterfacesJson))
    {
        [object]$networkInterfaceRef = Get-ArchLucidArgNestedProperty $networkInterface 'id'
        [string]$networkInterfaceId = "$networkInterfaceRef".Trim()

        if (-not [string]::IsNullOrWhiteSpace($networkInterfaceId))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $PrivateEndpointResourceId `
                -ToResourceId $networkInterfaceId `
                -AssociationType 'peToNic'
        }
    }

    foreach ($connection in @(
        @(ConvertFrom-ArchLucidArgJsonArray $PrivateLinkServiceConnectionsJson)
        @(ConvertFrom-ArchLucidArgJsonArray $ManualPrivateLinkServiceConnectionsJson)
    ))
    {
        [object]$connectionProperties = Get-ArchLucidArgNestedProperty $connection 'properties'
        [object]$privateLinkServiceRef = Get-ArchLucidArgNestedProperty $connectionProperties 'privateLinkServiceId'
        [string]$targetResourceId = "$privateLinkServiceRef".Trim()

        if (-not [string]::IsNullOrWhiteSpace($targetResourceId))
        {
            Add-ArchLucidNetworkAssociationRow `
                -Rows $Rows `
                -Seen $Seen `
                -FromResourceId $PrivateEndpointResourceId `
                -ToResourceId $targetResourceId `
                -AssociationType 'privateEndpointTarget'
        }
    }
}

function Get-ArchLucidArgNetworkAssociationQuerySpecs
{
    param(
        [string] $ResourceGroupScope = ""
    )

    [string]$rgFilter = ""

    if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
    {
        [string]$rg = "$ResourceGroupScope".Trim()
        $rgFilter = "| where resourceGroup =~ '$rg'"
    }

    return @(
        [pscustomobject]@{
            Kind = 'virtualMachine'
            Query = "Resources | where type =~ 'microsoft.compute/virtualmachines' $rgFilter | project id, type, networkInterfaces = properties.networkProfile.networkInterfaces"
        }
        [pscustomobject]@{
            Kind = 'networkInterface'
            Query = "Resources | where type =~ 'microsoft.network/networkinterfaces' $rgFilter | project id, type, ipConfigurations = properties.ipConfigurations, networkSecurityGroupId = properties.networkSecurityGroup.id"
        }
        [pscustomobject]@{
            Kind = 'vmssNetworkInterface'
            Query = "Resources | where type =~ 'microsoft.compute/virtualmachinescalesets/virtualmachines/networkinterfaces' $rgFilter | project id, type, ipConfigurations = properties.ipConfigurations, networkSecurityGroupId = properties.networkSecurityGroup.id"
        }
        [pscustomobject]@{
            Kind = 'bastionHost'
            Query = "Resources | where type =~ 'microsoft.network/bastionhosts' $rgFilter | project id, type, ipConfigurations = properties.ipConfigurations"
        }
        [pscustomobject]@{
            Kind = 'azureFirewall'
            Query = "Resources | where type =~ 'microsoft.network/azurefirewalls' $rgFilter | project id, type, ipConfigurations = properties.ipConfigurations, managementIpConfiguration = properties.managementIpConfiguration"
        }
        [pscustomobject]@{
            Kind = 'routeTable'
            Query = "Resources | where type =~ 'microsoft.network/routetables' $rgFilter | project id, type, routes = properties.routes"
        }
        [pscustomobject]@{
            Kind = 'appService'
            Query = "Resources | where type =~ 'microsoft.web/sites' $rgFilter | project id, type, virtualNetworkSubnetId = properties.virtualNetworkSubnetId"
        }
        [pscustomobject]@{
            Kind = 'publicIpAddress'
            Query = "Resources | where type =~ 'microsoft.network/publicipaddresses' $rgFilter | project id, type, ipConfiguration = properties.ipConfiguration, natGatewayId = properties.natGateway.id"
        }
        [pscustomobject]@{
            Kind = 'virtualNetwork'
            Query = "Resources | where type =~ 'microsoft.network/virtualnetworks' $rgFilter | project id, type, subnets = properties.subnets, peerings = properties.virtualNetworkPeerings"
        }
        [pscustomobject]@{
            Kind = 'privateEndpoint'
            Query = "Resources | where type =~ 'microsoft.network/privateendpoints' $rgFilter | project id, type, subnetId = tostring(properties.subnet.id), networkInterfaces = properties.networkInterfaces, privateLinkServiceConnections = properties.privateLinkServiceConnections, manualPrivateLinkServiceConnections = properties.manualPrivateLinkServiceConnections"
        }
    )
}

function Invoke-ArchLucidResourceGraphPagedAssociationQuery
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $QueryKind,

        [Parameter(Mandatory = $true)]
        [scriptblock] $FetchPage,

        [Parameter(Mandatory = $true)]
        [scriptblock] $ProcessRow
    )

    [string]$skipToken = $null

    do
    {
        try
        {
            [object]$page = & $FetchPage $skipToken

            foreach ($row in @(Get-ArchLucidResourceGraphPageDataArray $page))
            {
                & $ProcessRow $row
            }

            $skipToken = Get-ArchLucidResourceGraphPageSkipToken $page
        }
        catch
        {
            [string]$message = if ($null -ne $_.Exception) { $_.Exception.Message } else { "$_" }
            Write-Warning "ArchLucid Resource Graph $QueryKind query failed: $message"
            break
        }
    }
    while (-not ([string]::IsNullOrWhiteSpace($skipToken)))
}

function Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $ResourceGroupScope = "",

        [System.Collections.IList] $PublicIpIpConfigurationFacts = $null,

        [System.Collections.IList] $FirewallSubnetFacts = $null,

        [System.Collections.IList] $VirtualNetworkSubnetFacts = $null
    )

    if (-not (Get-Module -ListAvailable -Name Az.ResourceGraph))
    {
        return @()
    }

    Import-Module Az.ResourceGraph -ErrorAction Stop

    [System.Collections.ArrayList]$rows = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$firewallPrivateIpFacts = [System.Collections.ArrayList]::new()
    [System.Collections.ArrayList]$routeTableFacts = [System.Collections.ArrayList]::new()
    if ($null -eq $FirewallSubnetFacts) { $FirewallSubnetFacts = [System.Collections.ArrayList]::new() }
    if ($null -eq $VirtualNetworkSubnetFacts) { $VirtualNetworkSubnetFacts = [System.Collections.ArrayList]::new() }
    [hashtable]$seen = @{}

    foreach ($spec in @(Get-ArchLucidArgNetworkAssociationQuerySpecs -ResourceGroupScope $ResourceGroupScope))
    {
        [string]$queryKind = "$( $spec.Kind )"
        [string]$queryText = "$( $spec.Query )"

        Invoke-ArchLucidResourceGraphPagedAssociationQuery `
            -QueryKind $queryKind `
            -FetchPage {
                param([string] $PageSkipToken)

                [hashtable]$searchParams = @{
                    Query = $queryText
                    Subscription = $SubscriptionId
                    First = 1000
                }

                if (-not ([string]::IsNullOrWhiteSpace($PageSkipToken)))
                {
                    $searchParams['SkipToken'] = $PageSkipToken
                }

                Search-AzGraph @searchParams
            } `
            -ProcessRow {
                param([PSObject] $Row)

                [string]$resourceId = "$( $Row.id )".Trim()

                if ([string]::IsNullOrWhiteSpace($resourceId)) { return }

                switch ($queryKind)
                {
                    'virtualMachine' {
                        Add-ArchLucidArgNetworkAssociationRowsFromVmRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -VmResourceId $resourceId `
                            -NetworkInterfacesJson $Row.networkInterfaces
                    }
                    'networkInterface' {
                        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -NicResourceId $resourceId `
                            -IpConfigurationsJson $Row.ipConfigurations `
                            -NetworkSecurityGroupId "$( $Row.networkSecurityGroupId )".Trim() `
                            -PublicIpIpConfigurationFacts $PublicIpIpConfigurationFacts
                    }
                    'vmssNetworkInterface' {
                        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -NicResourceId $resourceId `
                            -IpConfigurationsJson $Row.ipConfigurations `
                            -NetworkSecurityGroupId "$( $Row.networkSecurityGroupId )".Trim() `
                            -PublicIpIpConfigurationFacts $PublicIpIpConfigurationFacts
                    }
                    'bastionHost' {
                        Add-ArchLucidArgNetworkAssociationRowsFromBastionRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -BastionResourceId $resourceId `
                            -IpConfigurationsJson $Row.ipConfigurations
                    }
                    'azureFirewall' {
                        Add-ArchLucidArgNetworkAssociationRowsFromFirewallRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -FirewallResourceId $resourceId `
                            -IpConfigurationsJson $Row.ipConfigurations `
                            -ManagementIpConfiguration $Row.managementIpConfiguration `
                            -FirewallPrivateIpFacts $firewallPrivateIpFacts `
                            -FirewallSubnetFacts $FirewallSubnetFacts
                    }
                    'routeTable' {
                        Add-ArchLucidArgNetworkAssociationRowsFromRouteTableRecord `
                            -RouteTableFacts $routeTableFacts `
                            -RouteTableResourceId $resourceId `
                            -RoutesJson $Row.routes
                    }
                    'appService' {
                        Add-ArchLucidArgNetworkAssociationRowsFromAppServiceRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -AppServiceResourceId $resourceId `
                            -VirtualNetworkSubnetId "$( $Row.virtualNetworkSubnetId )".Trim()
                    }
                    'publicIpAddress' {
                        Add-ArchLucidArgNetworkAssociationRowsFromPublicIpRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -PublicIpResourceId $resourceId `
                            -IpConfigurationJson $Row.ipConfiguration `
                            -NatGatewayId "$( $Row.natGatewayId )".Trim() `
                            -PublicIpIpConfigurationFacts $PublicIpIpConfigurationFacts
                    }
                    'virtualNetwork' {
                        Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -VNetResourceId $resourceId `
                            -SubnetsJson $Row.subnets `
                            -PeeringsJson $Row.peerings `
                            -VirtualNetworkSubnetFacts $VirtualNetworkSubnetFacts
                    }
                    'privateEndpoint' {
                        Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord `
                            -Rows $rows `
                            -Seen $seen `
                            -PrivateEndpointResourceId $resourceId `
                            -SubnetId "$( $Row.subnetId )".Trim() `
                            -NetworkInterfacesJson $Row.networkInterfaces `
                            -PrivateLinkServiceConnectionsJson $Row.privateLinkServiceConnections `
                            -ManualPrivateLinkServiceConnectionsJson $Row.manualPrivateLinkServiceConnections
                    }
                }
            }
    }

    Add-ArchLucidArgFirewallRoutedSubnetRows `
        -Rows $rows `
        -Seen $seen `
        -FirewallPrivateIpFacts $firewallPrivateIpFacts `
        -RouteTableFacts $routeTableFacts

    return @($rows.ToArray())
}

function Get-ArchLucidAzureAvdSessionHostAssociationRowsViaResourceGraph
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

    [string]$rgFilter = ""

    if (-not ([string]::IsNullOrWhiteSpace("$ResourceGroupScope")))
    {
        [string]$rg = "$ResourceGroupScope".Trim()
        $rgFilter = "| where resourceGroup =~ '$rg'"
    }

    [string]$query = "Resources | where type =~ 'microsoft.desktopvirtualization/hostpools/sessionhosts' $rgFilter | project id, vmResourceId = properties.resourceId"

    [System.Collections.ArrayList]$rows = [System.Collections.ArrayList]::new()
    [hashtable]$seen = @{}

    Invoke-ArchLucidResourceGraphPagedAssociationQuery `
        -QueryKind 'avdSessionHost' `
        -FetchPage {
            param([string] $PageSkipToken)

            [hashtable]$searchParams = @{
                Query = $query
                Subscription = $SubscriptionId
                First = 1000
            }

            if (-not ([string]::IsNullOrWhiteSpace($PageSkipToken)))
            {
                $searchParams['SkipToken'] = $PageSkipToken
            }

            Search-AzGraph @searchParams
        } `
        -ProcessRow {
            param([PSObject] $Row)

            [string]$sessionHostResourceId = "$( $Row.id )".Trim()
            [string]$virtualMachineResourceId = "$( $Row.vmResourceId )".Trim()

            if ([string]::IsNullOrWhiteSpace($sessionHostResourceId) -or [string]::IsNullOrWhiteSpace($virtualMachineResourceId))
            {
                return
            }

            Add-ArchLucidNetworkAssociationRow `
                -Rows $rows `
                -Seen $seen `
                -FromResourceId $sessionHostResourceId `
                -ToResourceId $virtualMachineResourceId `
                -AssociationType 'avdSessionHostToVm'
        }

    return @($rows.ToArray())
}
