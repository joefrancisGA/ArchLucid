#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.SecurityInventory.helpers.ps1' {

    BeforeAll {
        [string]$script:helperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.SecurityInventory.helpers.ps1'
        . $script:helperPath
    }

    It 'treats omitted inventory types as never-show' {
        @(
            'Microsoft.Network/privateDnsZones/virtualNetworkLinks'
            'Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks'
            'Microsoft.Portal/dashboards'
            'Microsoft.OperationalInsights/workspaces'
            'Microsoft.Insights/activityLogAlerts'
            'Microsoft.Insights/metricAlerts'
            'Microsoft.Insights/workbooks'
            'Microsoft.Insights/scheduledQueryRules'
            'Microsoft.Insights/actionGroups'
            'Microsoft.AlertsManagement/smartDetectorAlertRules'
            'Microsoft.OperationsManagement/solutions'
            'Microsoft.Network/dnszones'
            'Microsoft.Network/privateDnsZones'
            'Microsoft.Network/firewallPolicies'
            'Microsoft.Network/networkIntentPolicies'
            'Microsoft.Network/networkWatchers'
            'Microsoft.Network/networkWatchers/flowLogs'
            'Microsoft.ManagedIdentity/userAssignedIdentities'
            'Microsoft.Automation/automationAccounts'
            'Microsoft.Automation/automationAccounts/runbooks'
            'Microsoft.Compute/virtualMachines/extensions/versions'
            'Microsoft.Compute/virtualMachines/extensions'
            'Microsoft.Compute/disks'
            'Microsoft.Compute/sshPublicKeys'
            'Microsoft.Maintenance/maintenanceConfigurations'
            'Microsoft.Example/widgets/extensions'
        ) | ForEach-Object {
            Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType $_ |
                Should -Be $true -Because "type $_ should be omitted"
        }

        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType 'Microsoft.Network/virtualNetworks' |
            Should -Be $false
        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType 'Microsoft.Compute/virtualMachines' |
            Should -Be $false
        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security' |
            Should -Be $true
        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1' |
            Should -Be $true
        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1' |
            Should -Be $true
        Test-ArchLucidAzureInventoryNeverShowResourceType -ResourceType '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/sshPublicKeys/vm-ssh-key' |
            Should -Be $true
    }

    It 'omits SQL Server master databases from never-show filtering' {
        $masterDatabase = [ordered]@{
            resourceType = 'Microsoft.Sql/servers/databases'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/master'
            name = 'master'
        }
        $appDatabase = [ordered]@{
            resourceType = 'Microsoft.Sql/servers/databases'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-prod/databases/appdb'
            name = 'appdb'
        }

        Test-ArchLucidAzureInventoryNeverShowResource -Resource $masterDatabase |
            Should -Be $true
        Test-ArchLucidAzureInventoryNeverShowResource -Resource $appDatabase |
            Should -Be $false
    }

    It 'omits private-link-only network interfaces from never-show filtering' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/privateEndpoints'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1'
                properties = @{
                    'networkInterfaces[0]' = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic'
                }
            },
            [ordered]@{
                resourceType = 'Microsoft.Network/networkInterfaces'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/pe-nic'
                properties = @{
                    'privateEndpoint.id' = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1'
                }
            },
            [ordered]@{
                resourceType = 'Microsoft.Network/networkInterfaces'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-nic'
                properties = @{}
            }
        )

        [string[]]$omittedNicArmIds = @(Get-ArchLucidAzurePrivateLinkOnlyNicArmIds -InventoryResources $inventory)

        $omittedNicArmIds.Count | Should -Be 1
        Test-ArchLucidAzureInventoryNeverShowResource `
            -Resource $inventory[1] `
            -PrivateLinkOnlyNicArmIds $omittedNicArmIds |
            Should -Be $true
        Test-ArchLucidAzureInventoryNeverShowResource `
            -Resource $inventory[2] `
            -PrivateLinkOnlyNicArmIds $omittedNicArmIds |
            Should -Be $false
    }

    It 'skips public IP network associations when ipConfiguration.id is absent' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/publicIPAddresses'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/unattached-pip'
                properties = @{}
            }
        )

        { Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory } |
            Should -Not -Throw

        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 0
    }

    It 'skips subnet child resources and virtual networks without subnets under strict mode' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/virtualNetworks/subnets'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default'
                properties = [pscustomobject]@{ provisioningState = 'Succeeded' }
            },
            [ordered]@{
                resourceType = 'Microsoft.Network/virtualNetworks'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1'
                properties = [pscustomobject]@{ provisioningState = 'Succeeded' }
            }
        )

        { Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory } |
            Should -Not -Throw

        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 0
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

    It 'skips nsg allow rule derivation when securityRules is absent from inventory properties' {
        $inventory = @(
            [ordered]@{
                resourceType = 'Microsoft.Network/networkSecurityGroups'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1'
                properties = @{}
            }
        )

        { Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory } |
            Should -Not -Throw

        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 0
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

    It 'maps policy assignments that omit PolicySetDefinitionId without throwing' {
        $assignment = [PSCustomObject]@{
            Scope = '/subscriptions/sub1'
            PolicyDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/audit-storage'
            Name = 'audit-storage-assignment'
            ResourceId = '/subscriptions/sub1/providers/Microsoft.Authorization/policyAssignments/abc'
        }

        { Get-ArchLucidAzurePolicyAssignmentCompanionRows -PolicyAssignments @($assignment) } | Should -Not -Throw

        [object[]]$rows = @(Get-ArchLucidAzurePolicyAssignmentCompanionRows -PolicyAssignments @($assignment))

        $rows.Count | Should -Be 1
        $rows[0].policyDefinitionId | Should -Match 'policyDefinitions/audit-storage'
    }

    It 'maps initiative policy assignments that omit PolicyDefinitionId' {
        $assignment = [PSCustomObject]@{
            Scope = '/subscriptions/sub1'
            PolicySetDefinitionId = '/providers/Microsoft.Authorization/policySetDefinitions/audit-initiative'
            Name = 'audit-initiative-assignment'
            ResourceId = '/subscriptions/sub1/providers/Microsoft.Authorization/policyAssignments/def'
        }

        [object[]]$rows = @(Get-ArchLucidAzurePolicyAssignmentCompanionRows -PolicyAssignments @($assignment))

        $rows.Count | Should -Be 1
        $rows[0].policyDefinitionId | Should -Match 'policySetDefinitions/audit-initiative'
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

    It 'collects defender secure score rows per subscription' {
        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            $Path | Should -Match 'Microsoft.Security/secureScores'

            return [PSCustomObject]@{
                Content = (@{
                    value = @(
                        @{
                            name = 'ascScore'
                            properties = @{
                                score = @{
                                    percentage = 0.85
                                }
                            }
                        }
                    )
                } | ConvertTo-Json -Depth 8)
            }
        }

        [object[]]$rows = @(Get-ArchLucidAzureDefenderSummaryCompanionRows -SubscriptionId '11111111-1111-1111-1111-111111111111')

        $rows.Count | Should -Be 1
        $rows[0].resourceId | Should -Be '/subscriptions/11111111-1111-1111-1111-111111111111'
        $rows[0].secureScore | Should -Be 85
    }

    It 'rejects app setting values that contain password markers' {
        Test-ArchLucidAzureAppSettingHostRejectedValue -Value 'Server=tcp:sql.database.windows.net;Password=secret' |
            Should -Be $true

        $parsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'SqlConnection' `
            -Value 'Server=tcp:sql.database.windows.net;Password=secret'

        $parsed | Should -Be $null
    }

    It 'parses sql host and key vault reference without storing secret values' {
        $sqlParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'SqlConnection' `
            -Value 'Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=db;'

        $sqlParsed.parsedHost | Should -Be 'prodsql.database.windows.net'
        ($sqlParsed | ConvertTo-Json) | Should -Not -Match 'Password='

        $kvParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'SqlPassword' `
            -Value '@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password)'

        $kvParsed.keyVaultHost | Should -Be 'myvault.vault.azure.net'
        $kvParsed.secretName | Should -Be 'sql-password'
    }

    It 'parses sql catalog https hosts and template catalog warnings' {
        $sqlParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'SqlConnection' `
            -Value 'Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=archlucid;'

        $sqlParsed.parsedHost | Should -Be 'prodsql.database.windows.net'
        $sqlParsed.catalog | Should -Be 'archlucid'

        $blobParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'BlobUri' `
            -Value 'https://starchlucidevarts.blob.core.windows.net/'

        $blobParsed.parsedHost | Should -Be 'starchlucidevarts.blob.core.windows.net'

        $vaultParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'VaultUri' `
            -Value 'https://kvrgexample.vault.azure.net/'

        $vaultParsed.keyVaultHost | Should -Be 'kvrgexample.vault.azure.net'

        $apiParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'ARCHLUCID_API_BASE_URL' `
            -Value 'https://archlucid-api.eastus2.azurecontainerapps.io'

        $apiParsed.parsedHost | Should -Be 'archlucid-api.eastus2.azurecontainerapps.io'

        $templateParsed = Get-ArchLucidAzureAppSettingHostFromValue `
            -SettingName 'SqlConnection' `
            -Value 'Server=tcp:prodsql.database.windows.net,1433;Initial Catalog={0};'

        $templateParsed.parsedHost | Should -Be 'prodsql.database.windows.net'
        $templateParsed.catalog | Should -Be $null
        $templateParsed.warningCode | Should -Be 'app-settings-catalog-template'
    }

    It 'collects container app env host rows without persisting values' {
        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            $Method | Should -Be 'GET'
            $Path | Should -Match 'Microsoft.App/containerApps/app1'

            return [PSCustomObject]@{
                StatusCode = 200
                Content = (@{
                    properties = @{
                        template = @{
                            containers = @(
                                @{
                                    name = 'app'
                                    env = @(
                                        @{
                                            name = 'ConnectionStrings__ArchLucid'
                                            value = 'Server=tcp:sql1.database.windows.net,1433;Initial Catalog=archlucid;'
                                        }
                                        @{
                                            name = 'ConnectionStrings__ArchLucidSecret'
                                            secretRef = 'al-cs-key'
                                        }
                                    )
                                }
                            )
                        }
                    }
                } | ConvertTo-Json -Depth 12)
            }
        }

        $inventory = @(
            [PSCustomObject]@{
                resourceType = 'Microsoft.App/containerApps'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1'
            }
        )

        [object[]]$rows = @(Get-ArchLucidAzureAppSettingHostCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 2
        ($rows | Where-Object { $_.settingName -eq 'ConnectionStrings__ArchLucid' }).host |
            Should -Be 'sql1.database.windows.net'
        ($rows | ConvertTo-Json -Depth 6) | Should -Not -Match '1433'
        ($rows | Where-Object { $_.settingName -eq 'ConnectionStrings__ArchLucidSecret' }).secretRef |
            Should -Be 'al-cs-key'
    }

    It 'never posts container app env collection requests' {
        $postedPaths = [System.Collections.ArrayList]::new()

        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            if ($Method -eq 'POST')
            {
                [void]$postedPaths.Add($Path)
            }

            return [PSCustomObject]@{
                StatusCode = 200
                Content = (@{
                    properties = @{
                        template = @{
                            containers = @(
                                @{
                                    name = 'app'
                                    env = @(
                                        @{
                                            name = 'ARCHLUCID_API_BASE_URL'
                                            value = 'https://archlucid-api.eastus2.azurecontainerapps.io'
                                        }
                                    )
                                }
                            )
                        }
                    }
                } | ConvertTo-Json -Depth 12)
            }
        }

        $inventory = @(
            [PSCustomObject]@{
                resourceType = 'Microsoft.App/containerApps'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app1'
            }
        )

        [void](Get-ArchLucidAzureAppSettingHostCompanionRows -InventoryResources $inventory)

        @($postedPaths) | Should -Be @()
    }

    It 'collects service connector linker rows when linkers exist' {
        function Invoke-AzRestMethod {
            param(
                [string] $Method,
                [string] $Path
            )

            $Path | Should -Match 'ServiceLinker/linkers'

            return [PSCustomObject]@{
                StatusCode = 200
                Content = (@{
                    value = @(
                        @{
                            id = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1/providers/Microsoft.ServiceLinker/linkers/sql-link'
                            name = 'sql-link'
                            properties = @{
                                targetService = @{
                                    id = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1'
                                }
                            }
                        }
                    )
                } | ConvertTo-Json -Depth 8)
            }
        }

        $inventory = @(
            [PSCustomObject]@{
                resourceType = 'Microsoft.Web/sites'
                resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1'
            }
        )

        [object[]]$rows = @(Get-ArchLucidAzureServiceConnectorCompanionRows -InventoryResources $inventory)

        $rows.Count | Should -Be 1
        $rows[0].linkerName | Should -Be 'sql-link'
        $rows[0].targetResourceId | Should -Match 'Microsoft.Sql/servers/sql1'
    }
}
