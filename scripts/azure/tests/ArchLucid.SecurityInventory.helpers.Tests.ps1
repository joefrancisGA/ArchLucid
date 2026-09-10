#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.SecurityInventory.helpers.ps1' {

    BeforeAll {
        [string]$script:helperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.SecurityInventory.helpers.ps1'
        . $script:helperPath
    }

    It 'builds network association rows from enriched inventory resources' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/networkInterfaces'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1'
                properties = @{
                    'ipConfiguration.subnet.id' = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default'
                }
            },
            [ordered]@{
                resourceType = 'Microsoft.Network/publicIPAddresses'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1'
                properties = @{
                    'ipConfiguration.id' = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1'
                }
            }
        )

        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 2
        @($rows | Where-Object { $_.associationType -eq 'nicToSubnet' }).Count | Should -Be 1
        @($rows | Where-Object { $_.associationType -eq 'publicIpToNic' }).Count | Should -Be 1
    }

    It 'maps Get-AzRoleAssignment rows into companion JSON shape' {
        function Get-AzRoleAssignment {
            return @(
                [PSCustomObject]@{
                    Scope = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1'
                    ObjectId = '11111111-1111-1111-1111-111111111111'
                    ObjectType = 'User'
                    RoleDefinitionId = '/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
                }
            )
        }

        [object[]]$rows = @(Get-ArchLucidAzureRoleAssignmentCompanionRows -SubscriptionId 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

        $rows.Count | Should -Be 1
        $rows[0].scope | Should -Not -BeNullOrEmpty
        $rows[0].principalId | Should -Be '11111111-1111-1111-1111-111111111111'
        $rows[0].principalType | Should -Be 'User'
        $rows[0].roleDefinitionId | Should -Not -BeNullOrEmpty
    }
}
