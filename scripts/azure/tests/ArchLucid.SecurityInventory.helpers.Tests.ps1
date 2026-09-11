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
        $rows[0].pimEligibilityKind | Should -Be 'standing'
    }

    It 'builds nsg allow rule rows for storage service tag inbound allow rules' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/networkSecurityGroups'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1'
                properties = @{
                    securityRules = '[{"name":"AllowStorageInbound","properties":{"access":"Allow","direction":"Inbound","destinationAddressPrefix":"Storage"}}]'
                }
            },
            [ordered]@{
                resourceType = 'Microsoft.Network/virtualNetworks'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1'
                properties = @{
                    subnets = '[{"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default","properties":{"networkSecurityGroup":{"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1"}}}]'
                }
            },
            [ordered]@{
                resourceType = 'Microsoft.Storage/storageAccounts'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1'
                properties = @{}
            }
        )

        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory)

        @($rows | Where-Object { $_.associationType -eq 'nsgAllowRule' }).Count | Should -Be 1
    }

    It 'collects management group and subscription role assignments when ManagementGroupId is set' {
        function Get-ArchLucidManagementGroupSubscriptionIds {
            param([string] $ManagementGroupId)
            return @('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
        }

        function Get-AzRoleAssignment {
            param(
                [string] $Scope,
                [string] $ResourceGroupName
            )

            if (-not ([string]::IsNullOrWhiteSpace($Scope)))
            {
                return @(
                    [PSCustomObject]@{
                        Scope = $Scope
                        ObjectId = '11111111-1111-1111-1111-111111111111'
                        ObjectType = 'User'
                        RoleDefinitionId = '/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
                    }
                )
            }

            return @()
        }

        [object[]]$rows = @(Get-ArchLucidAzureRoleAssignmentCompanionRows -ManagementGroupId 'mg1')

        $rows.Count | Should -Be 2
        @($rows | Where-Object { $_.pimEligibilityKind -eq 'standing' }).Count | Should -Be 2
    }

    It 'prefers standing assignments over eligible duplicates' {
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

        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            return [PSCustomObject]@{
                Content = (@{
                    value = @(
                        @{
                            properties = @{
                                scope = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1'
                                principalId = '11111111-1111-1111-1111-111111111111'
                                principalType = 'User'
                                roleDefinitionId = '/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
                            }
                        }
                    )
                } | ConvertTo-Json -Depth 8)
            }
        }

        [object[]]$rows = @(Get-ArchLucidAzureRoleAssignmentCompanionRows -SubscriptionId 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

        $rows.Count | Should -Be 1
        $rows[0].pimEligibilityKind | Should -Be 'standing'
    }

    It 'collects management group eligibility schedules without subscription graph helper' {
        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            if ($Path -like '*/managementGroups/mg1/*')
            {
                return [PSCustomObject]@{
                    Content = (@{
                        value = @(
                            @{
                                properties = @{
                                    scope = '/providers/Microsoft.Management/managementGroups/mg1'
                                    principalId = '33333333-3333-3333-3333-333333333333'
                                    principalType = 'User'
                                    roleDefinitionId = '/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
                                }
                            }
                        )
                    } | ConvertTo-Json -Depth 8)
                }
            }

            return [PSCustomObject]@{ Content = '{"value":[]}' }
        }

        [object[]]$rows = @(Get-ArchLucidAzureRoleEligibilityScheduleCompanionRows -ManagementGroupId 'mg1')

        $rows.Count | Should -Be 1
        $rows[0].pimEligibilityKind | Should -Be 'eligible'
        $rows[0].scope | Should -Match 'managementGroups/mg1'
    }

    It 'maps policy assignments into companion rows' {
        $assignment = [PSCustomObject]@{
            Scope = '/providers/Microsoft.Management/managementGroups/corp'
            PolicyDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/audit-storage'
            PolicySetDefinitionId = $null
            Name = 'audit-storage-assignment'
            ResourceId = '/providers/Microsoft.Management/managementGroups/corp/providers/Microsoft.Authorization/policyAssignments/abc'
        }

        [object[]]$rows = @(Get-ArchLucidAzurePolicyAssignmentCompanionRows -PolicyAssignments @($assignment))

        $rows.Count | Should -Be 1
        $rows[0].scope | Should -Be '/providers/Microsoft.Management/managementGroups/corp'
        $rows[0].policyDefinitionId | Should -Match 'policyDefinitions/audit-storage'
    }

    It 'collects diagnostic settings for path-relevant resources' {
        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            $Path | Should -Match 'storageAccounts/sa1/providers/Microsoft.Insights/diagnosticSettings'

            return [PSCustomObject]@{
                Content = (@{
                    value = @(
                        @{
                            name = 'diag-to-law'
                            properties = @{
                                workspaceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1'
                            }
                        }
                    )
                } | ConvertTo-Json -Depth 8)
            }
        }

        $inventory = @(
            [PSCustomObject]@{
                resourceType = 'Microsoft.Storage/storageAccounts'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1'
            },
            [PSCustomObject]@{
                resourceType = 'Microsoft.Compute/virtualMachines'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1'
            }
        )

        [object[]]$rows = @(Get-ArchLucidAzureDiagnosticSettingCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 1
        $rows[0].targetResourceId | Should -Match 'storageAccounts/sa1'
        $rows[0].workspaceId | Should -Match 'OperationalInsights/workspaces/ws1'
    }
}
