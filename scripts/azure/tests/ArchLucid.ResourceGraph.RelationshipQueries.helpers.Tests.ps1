#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1' {

    BeforeAll {
        [string]$scriptDir = Split-Path -Parent $PSScriptRoot
        . (Join-Path $scriptDir 'ArchLucid.ResourceGraph.helpers.ps1')
        . (Join-Path $scriptDir 'ArchLucid.SecurityInventory.helpers.ps1')
        . (Join-Path $scriptDir 'ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1')
    }

    It 'projects type on each ARG relationship query' {
        $specs = @(Get-ArchLucidArgNetworkAssociationQuerySpecs)

        $specs.Count | Should -Be 4
        foreach ($spec in $specs)
        {
            $spec.Query | Should -Match 'project id, type'
        }

        ($specs | Where-Object { $_.Kind -eq 'virtualNetwork' }).Query |
            Should -Match 'peerings = properties.virtualNetworkPeerings'
    }

    It 'emits vnetPeering from a VNet ARG record without a type column' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $peeringsJson = @'
[
  {
    "name": "peer-to-hub",
    "properties": {
      "remoteVirtualNetwork": {
        "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/hub"
      }
    }
  }
]
'@

        Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord `
            -Rows $rows `
            -Seen $seen `
            -VNetResourceId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/spoke' `
            -SubnetsJson '[]' `
            -PeeringsJson $peeringsJson

        $rows.Count | Should -Be 1
        $rows[0].associationType | Should -Be 'vnetPeering'
        $rows[0].toResourceId | Should -Match 'virtualNetworks/hub'
    }

    It 'builds an ARG query for AVD session host to VM associations' {
        $specQuery = @(
            Get-ArchLucidArgNetworkAssociationQuerySpecs |
                Where-Object { $_.Kind -eq 'virtualMachine' }
        ).Query

        $specQuery | Should -Match 'microsoft.compute/virtualmachines'

        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}

        Add-ArchLucidNetworkAssociationRow `
            -Rows $rows `
            -Seen $seen `
            -FromResourceId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1' `
            -ToResourceId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-001' `
            -AssociationType 'avdSessionHostToVm'

        $rows.Count | Should -Be 1
        $rows[0].associationType | Should -Be 'avdSessionHostToVm'
    }

    It 'emits nicToSubnet, publicIpToNic, and nicToNsg from JSON-string NIC ipConfigurations' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic01'
        $subnetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/default'
        $publicIpId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip01'
        $nsgId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg01'
        $ipConfigurationsJson = @"
[
  {
    "properties": {
      "subnet": { "id": "$subnetId" },
      "publicIPAddress": { "id": "$publicIpId" }
    }
  }
]
"@

        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
            -Rows $rows `
            -Seen $seen `
            -NicResourceId $nicId `
            -IpConfigurationsJson $ipConfigurationsJson `
            -NetworkSecurityGroupId $nsgId

        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' })[0].toResourceId | Should -Be $subnetId
        @($rows | Where-Object { $_.associationType -eq 'publicIpToNic' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'publicIpToNic' })[0].fromResourceId | Should -Be $publicIpId
        @($rows | Where-Object { $_.associationType -eq 'nicToNsg' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'nicToNsg' })[0].toResourceId | Should -Be $nsgId
    }

    It 'emits the same NIC association rows when ipConfigurations are object arrays' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic02'
        $subnetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app'
        $publicIpId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip02'
        $ipConfigurations = @(
            [pscustomobject]@{
                properties = [pscustomobject]@{
                    subnet = [pscustomobject]@{ id = $subnetId }
                    publicIPAddress = [pscustomobject]@{ id = $publicIpId }
                }
            }
        )

        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
            -Rows $rows `
            -Seen $seen `
            -NicResourceId $nicId `
            -IpConfigurationsJson $ipConfigurations

        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' })[0].toResourceId | Should -Be $subnetId
        @($rows | Where-Object { $_.associationType -eq 'publicIpToNic' }).Count | Should -Be 1
    }

    It 'emits vmToNic from a VM networkInterfaces object array' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $vmId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm01'
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-vm01'
        $networkInterfaces = @(
            [pscustomobject]@{ id = $nicId }
        )

        Add-ArchLucidArgNetworkAssociationRowsFromVmRecord `
            -Rows $rows `
            -Seen $seen `
            -VmResourceId $vmId `
            -NetworkInterfacesJson $networkInterfaces

        $rows.Count | Should -Be 1
        $rows[0].associationType | Should -Be 'vmToNic'
        $rows[0].fromResourceId | Should -Be $vmId
        $rows[0].toResourceId | Should -Be $nicId
    }

    It 'emits subnetToNsg from a VNet subnets object array' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $vnetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet01'
        $subnetId = "$vnetId/subnets/app"
        $nsgId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-app'
        $subnets = @(
            [pscustomobject]@{
                id = $subnetId
                properties = [pscustomobject]@{
                    networkSecurityGroup = [pscustomobject]@{ id = $nsgId }
                }
            }
        )

        Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord `
            -Rows $rows `
            -Seen $seen `
            -VNetResourceId $vnetId `
            -SubnetsJson $subnets `
            -PeeringsJson @()

        @($rows | Where-Object { $_.associationType -eq 'subnetToNsg' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'subnetToNsg' })[0].fromResourceId | Should -Be $subnetId
        @($rows | Where-Object { $_.associationType -eq 'subnetToNsg' })[0].toResourceId | Should -Be $nsgId
    }

    It 'emits no rows for null or whitespace ipConfigurations' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/empty'

        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
            -Rows $rows `
            -Seen $seen `
            -NicResourceId $nicId `
            -IpConfigurationsJson $null

        Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
            -Rows $rows `
            -Seen $seen `
            -NicResourceId $nicId `
            -IpConfigurationsJson '   '

        $rows.Count | Should -Be 0
    }

    It 'emits private-endpoint placement and target rows from object arrays' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $privateEndpointId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe01'
        $subnetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/private'
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic01'
        $targetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv01'

        Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord `
            -Rows $rows `
            -Seen $seen `
            -PrivateEndpointResourceId $privateEndpointId `
            -SubnetId $subnetId `
            -NetworkInterfacesJson @([pscustomobject]@{ id = $nicId }) `
            -PrivateLinkServiceConnectionsJson @(
                [pscustomobject]@{
                    properties = [pscustomobject]@{ privateLinkServiceId = $targetId }
                }
            ) `
            -ManualPrivateLinkServiceConnectionsJson @()

        @($rows | Where-Object { $_.associationType -eq 'peToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'peToSubnet' })[0].toResourceId | Should -Be $subnetId
        @($rows | Where-Object { $_.associationType -eq 'peToNic' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'peToNic' })[0].toResourceId | Should -Be $nicId
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' })[0].toResourceId | Should -Be $targetId
    }

    It 'emits private-endpoint target rows from JSON strings and manual connections' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $privateEndpointId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe02'
        $subnetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/private'
        $nicId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic02'
        $targetId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage01'

        Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord `
            -Rows $rows `
            -Seen $seen `
            -PrivateEndpointResourceId $privateEndpointId `
            -SubnetId $subnetId `
            -NetworkInterfacesJson "[{`"id`":`"$nicId`"}]" `
            -PrivateLinkServiceConnectionsJson '[]' `
            -ManualPrivateLinkServiceConnectionsJson "[{`"properties`":{`"privateLinkServiceId`":`"$targetId`"}}]"

        @($rows | Where-Object { $_.associationType -eq 'peToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'peToNic' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' })[0].toResourceId | Should -Be $targetId
    }

    It 'emits no private-endpoint rows for empty placement inputs' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}

        Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord `
            -Rows $rows `
            -Seen $seen `
            -PrivateEndpointResourceId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/empty' `
            -SubnetId '   ' `
            -NetworkInterfacesJson $null `
            -PrivateLinkServiceConnectionsJson '   ' `
            -ManualPrivateLinkServiceConnectionsJson $null

        $rows.Count | Should -Be 0
    }

    It 'collects private-endpoint target rows from two paged result sets' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $targetPageOne = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-page1'
        $targetPageTwo = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-page2'
        $script:pagedPrivateEndpointFetchCount = 0
        $pages = @(
            [pscustomobject]@{
                data = @(
                    [pscustomobject]@{
                        id = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-page1'
                        subnetId = ''
                        networkInterfaces = @()
                        privateLinkServiceConnections = @(
                            [pscustomobject]@{
                                properties = [pscustomobject]@{ privateLinkServiceId = $targetPageOne }
                            }
                        )
                        manualPrivateLinkServiceConnections = @()
                    }
                )
                '$skipToken' = 'token-page-2'
            }
            [pscustomobject]@{
                data = @(
                    [pscustomobject]@{
                        id = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-page2'
                        subnetId = ''
                        networkInterfaces = @()
                        privateLinkServiceConnections = @(
                            [pscustomobject]@{
                                properties = [pscustomobject]@{ privateLinkServiceId = $targetPageTwo }
                            }
                        )
                        manualPrivateLinkServiceConnections = @()
                    }
                )
                '$skipToken' = $null
            }
        )

        Invoke-ArchLucidResourceGraphPagedAssociationQuery `
            -QueryKind 'privateEndpoint' `
            -FetchPage {
                param([string] $PageSkipToken)

                $page = $pages[$script:pagedPrivateEndpointFetchCount]
                $script:pagedPrivateEndpointFetchCount++
                return $page
            } `
            -ProcessRow {
                param([PSObject] $Row)

                Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord `
                    -Rows $rows `
                    -Seen $seen `
                    -PrivateEndpointResourceId "$( $Row.id )".Trim() `
                    -SubnetId "$( $Row.subnetId )".Trim() `
                    -NetworkInterfacesJson $Row.networkInterfaces `
                    -PrivateLinkServiceConnectionsJson $Row.privateLinkServiceConnections `
                    -ManualPrivateLinkServiceConnectionsJson $Row.manualPrivateLinkServiceConnections
            }

        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' }).Count | Should -Be 2
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' } | ForEach-Object { $_.toResourceId }) |
            Should -Contain $targetPageOne
        @($rows | Where-Object { $_.associationType -eq 'privateEndpointTarget' } | ForEach-Object { $_.toResourceId }) |
            Should -Contain $targetPageTwo
    }

    It 'collects nicToSubnet rows from two paged NIC result sets' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $subnetPageOne = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/page1'
        $subnetPageTwo = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/page2'
        $nicPageOne = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-page1'
        $nicPageTwo = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-page2'

        $script:pagedNicFetchCount = 0
        $pages = @(
            [pscustomobject]@{
                data = @(
                    [pscustomobject]@{
                        id = $nicPageOne
                        ipConfigurations = @(
                            [pscustomobject]@{
                                properties = [pscustomobject]@{
                                    subnet = [pscustomobject]@{ id = $subnetPageOne }
                                }
                            }
                        )
                        networkSecurityGroupId = $null
                    }
                )
                '$skipToken' = 'token-page-2'
            }
            [pscustomobject]@{
                data = @(
                    [pscustomobject]@{
                        id = $nicPageTwo
                        ipConfigurations = @(
                            [pscustomobject]@{
                                properties = [pscustomobject]@{
                                    subnet = [pscustomobject]@{ id = $subnetPageTwo }
                                }
                            }
                        )
                        networkSecurityGroupId = $null
                    }
                )
                '$skipToken' = $null
            }
        )

        Invoke-ArchLucidResourceGraphPagedAssociationQuery `
            -QueryKind 'networkInterface' `
            -FetchPage {
                param([string] $PageSkipToken)

                if ($script:pagedNicFetchCount -ge $pages.Count)
                {
                    throw 'unexpected extra page fetch'
                }

                $page = $pages[$script:pagedNicFetchCount]
                $script:pagedNicFetchCount++
                return $page
            } `
            -ProcessRow {
                param([PSObject] $Row)

                Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
                    -Rows $rows `
                    -Seen $seen `
                    -NicResourceId "$( $Row.id )".Trim() `
                    -IpConfigurationsJson $Row.ipConfigurations `
                    -NetworkSecurityGroupId "$( $Row.networkSecurityGroupId )".Trim()
            }

        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' }).Count | Should -Be 2
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' } | ForEach-Object { $_.toResourceId }) |
            Should -Contain $subnetPageOne
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' } | ForEach-Object { $_.toResourceId }) |
            Should -Contain $subnetPageTwo
    }

    It 'keeps page-one nicToSubnet rows when page two fails and emits a warning' {
        $rows = [System.Collections.ArrayList]::new()
        $seen = @{}
        $subnetPageOne = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/survivor'
        $nicPageOne = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-survivor'
        $warnings = @()

        Invoke-ArchLucidResourceGraphPagedAssociationQuery `
            -QueryKind 'networkInterface' `
            -FetchPage {
                param([string] $PageSkipToken)

                if ([string]::IsNullOrWhiteSpace($PageSkipToken))
                {
                    return [pscustomobject]@{
                        data = @(
                            [pscustomobject]@{
                                id = $nicPageOne
                                ipConfigurations = @(
                                    [pscustomobject]@{
                                        properties = [pscustomobject]@{
                                            subnet = [pscustomobject]@{ id = $subnetPageOne }
                                        }
                                    }
                                )
                                networkSecurityGroupId = $null
                            }
                        )
                        '$skipToken' = 'token-page-2'
                    }
                }

                throw 'simulated page-two failure'
            } `
            -ProcessRow {
                param([PSObject] $Row)

                Add-ArchLucidArgNetworkAssociationRowsFromNicRecord `
                    -Rows $rows `
                    -Seen $seen `
                    -NicResourceId "$( $Row.id )".Trim() `
                    -IpConfigurationsJson $Row.ipConfigurations `
                    -NetworkSecurityGroupId "$( $Row.networkSecurityGroupId )".Trim()
            } -WarningVariable warnings

        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' })[0].toResourceId | Should -Be $subnetPageOne
        $warnings.Count | Should -BeGreaterThan 0
        ($warnings | Out-String) | Should -Match 'networkInterface'
        ($warnings | Out-String) | Should -Match 'simulated page-two failure'
    }
}
