#Requires -Version 7.0
# Run: Invoke-Pester -EnableExit -Path 'scripts/azure/tests/Get-ArchLucidAzurePackage.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'Get-ArchLucidAzurePackage.ps1' {

    BeforeAll {
        # Stub targets for Pester Mock when Az.* modules are installed locally.
        function Get-AzSubscription { }
        function Get-AzContext { }
        function Set-AzContext { }
        function Get-AzResource { }
        function Invoke-AzRestMethod { }
        function Get-AzPolicyDefinition { }
        function Get-AzPolicyAssignment { }

        function Get-AzRoleAssignment {
            return @(
                [PSCustomObject]@{
                    Scope = '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1'
                    ObjectId = '11111111-1111-1111-1111-111111111111'
                    ObjectType = 'User'
                    RoleDefinitionId = '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c'
                }
            )
        }

        # Pester 5 discovery can run before $PSScriptRoot is populated at script scope.
        [string]$script:scriptRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:extractorScript = Join-Path $script:scriptRoot 'Get-ArchLucidAzurePackage.ps1'
        [string]$script:helpersScript = Join-Path $script:scriptRoot 'ArchLucid.ExtractorQuickStart.helpers.ps1'
        [string]$script:securityHelpersScript = Join-Path $script:scriptRoot 'ArchLucid.SecurityInventory.helpers.ps1'
        [string]$script:armFixturePath = Join-Path $PSScriptRoot 'fixtures/arm-resources.sample.json'
        . $script:helpersScript
        . $script:securityHelpersScript
        [object]$previousModuleAutoLoadingPreference =
            Get-Variable -Name PSModuleAutoLoadingPreference -ValueOnly -ErrorAction SilentlyContinue

        if ($null -eq $previousModuleAutoLoadingPreference)
        {
            $previousModuleAutoLoadingPreference = 'All'
        }

        [string]$script:previousModuleAutoLoadingPreference = "$previousModuleAutoLoadingPreference"
        $PSModuleAutoLoadingPreference = 'None'
        $env:ARCHLUCID_EXTRACTOR_SKIP_AZ_CLI_SYNC = '1'

        function script:New-ArchLucidMockAzResource([object] $FixtureRow)
        {
            return [PSCustomObject]@{
                ResourceType = $FixtureRow.resourceType
                ResourceId = $FixtureRow.resourceId
                Name = $FixtureRow.name
                Location = $FixtureRow.location
                Sku = $FixtureRow.sku
                Tags = $FixtureRow.tags
                Properties = [PSCustomObject]$FixtureRow.properties
            }
        }
    }

    AfterAll {
        Set-Variable -Name PSModuleAutoLoadingPreference -Value $script:previousModuleAutoLoadingPreference -Scope Global
        Remove-Item Env:ARCHLUCID_EXTRACTOR_SKIP_AZ_CLI_SYNC -ErrorAction SilentlyContinue
    }

    It 'stores registry login servers and CustomerScript AKS image evidence without secrets' {
        [object]$registry = [pscustomobject]@{
            resourceType = 'Microsoft.ContainerRegistry/registries'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerRegistry/registries/acr'
            properties = @{}
        }
        [object]$cluster = [pscustomobject]@{
            resourceType = 'Microsoft.ContainerService/managedClusters'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
            properties = @{}
        }

        Mock Invoke-AzRestMethod {
            [CmdletBinding()]
            param(
                [string]$Method,
                [string]$Path,
                [string]$Payload
            )

            if ($Path -like '*Microsoft.ContainerRegistry/registries/*')
            {
                return [pscustomobject]@{
                    StatusCode = 200
                    Content = '{"type":"Microsoft.ContainerRegistry/registries","properties":{"loginServer":"acr.azurecr.io"}}'
                }
            }

            return [pscustomobject]@{
                StatusCode = 200
                Content = '{"properties":{"provisioningState":"Succeeded","logs":"acr.azurecr.io/app:1\nacr.azurecr.io/app:1\nmcr.microsoft.com/pause:3"}}'
            }
        }

        Expand-ArchLucidAzureContainerImageAndRegistryProperties -InventoryResources @($registry)
        [object]$aksResult = Add-ArchLucidAzureAksWorkloadImageProperties -InventoryResources @($cluster)

        $registry.properties.loginServer | Should -Be 'acr.azurecr.io'
        $cluster.properties.'container.image[0]' | Should -Be 'acr.azurecr.io/app:1'
        $cluster.properties.'container.image[1]' | Should -Be 'mcr.microsoft.com/pause:3'
        $aksResult.warnings | Should -BeNullOrEmpty
        ($cluster.properties | ConvertTo-Json -Depth 12) | Should -Not -Match 'secret|environment|password'
    }

    It 'reads AKS runCommand output from logs and warns when logs are absent' {
        [object]$cluster = [pscustomobject]@{
            resourceType = 'Microsoft.ContainerService/managedClusters'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
            properties = @{}
        }

        Mock Invoke-AzRestMethod {
            [CmdletBinding()]
            param(
                [string]$Method,
                [string]$Path,
                [string]$Payload
            )

            return [pscustomobject]@{
                StatusCode = 200
                Content = '{"properties":{"provisioningState":"Succeeded","logResult":"ignored.azurecr.io/app:1"}}'
            }
        }

        [object]$missingLogsResult = Add-ArchLucidAzureAksWorkloadImageProperties -InventoryResources @($cluster)
        $missingLogsResult.warnings | Should -Contain 'aks-workload-images-not-collected-customer-script:missing-logs:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
        $cluster.properties.Keys | Where-Object { $_ -like 'container.image[*]' } | Should -BeNullOrEmpty
    }

    It 'classifies AKS runCommand HTTP 403 as insufficient-rbac warning' {
        [object]$cluster = [pscustomobject]@{
            resourceType = 'Microsoft.ContainerService/managedClusters'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
            properties = @{}
        }

        Mock Invoke-AzRestMethod {
            [CmdletBinding()]
            param(
                [string]$Method,
                [string]$Path,
                [string]$Payload
            )

            return [pscustomobject]@{
                StatusCode = 403
                Content = '{"error":{"code":"AuthorizationFailed"}}'
            }
        }

        [object]$forbiddenResult = Add-ArchLucidAzureAksWorkloadImageProperties -InventoryResources @($cluster)
        $forbiddenResult.warnings | Should -Contain 'aks-workload-images-not-collected-customer-script:insufficient-rbac:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
    }

    It 'appends api-version to AKS runCommand poll paths' {
        Get-ArchLucidAzureAksRunCommandPollPath `
            -CommandResultId '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks/commandResults/abc' |
            Should -Be '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks/commandResults/abc?api-version=2024-02-01'
    }

    It 'builds the AKS workload image kubectl command with a jsonpath backslash-n separator' {
        [string]$command = Get-ArchLucidAzureAksWorkloadImageKubectlCommand
        $command | Should -Match '\{\.image\}\{\\"\\n\\"\}'
        $command.Contains([char]10) | Should -Be $false
    }

    It 'stores nodeResourceGroup and vmssToSubnet companion rows' {
        [object]$cluster = [pscustomobject]@{
            resourceType = 'Microsoft.ContainerService/managedClusters'
            resourceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks'
            properties = @{}
        }
        [object]$vmss = [pscustomobject]@{
            resourceType = 'Microsoft.Compute/virtualMachineScaleSets'
            resourceId = '/subscriptions/sub/resourceGroups/MC_rg_aks_westus/providers/Microsoft.Compute/virtualMachineScaleSets/aks-aephidev-16035491-vmss'
            properties = @{
                'ipConfiguration.subnet.id[0]' = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/nodes'
            }
        }

        Mock Invoke-AzRestMethod {
            [CmdletBinding()]
            param(
                [string]$Method,
                [string]$Path
            )

            if ($Method -eq 'GET' -and $Path -like '*managedClusters/*')
            {
                return [pscustomobject]@{
                    StatusCode = 200
                    Content = '{"properties":{"nodeResourceGroup":"MC_rg_aks_westus"}}'
                }
            }

            return [pscustomobject]@{ StatusCode = 404 }
        }

        Expand-ArchLucidAzureManagedClusterAndVmssProperties -InventoryResources @($cluster, $vmss)
        [object[]]$rows = @(Get-ArchLucidAzureNetworkAssociationCompanionRows -InventoryResources @($vmss))

        $cluster.properties['nodeResourceGroup'] | Should -Be 'MC_rg_aks_westus'
        @($rows | Where-Object { $_.associationType -eq 'vmssToSubnet' }).Count | Should -Be 1
    }

    It 'writes a schema-version-2 ZIP with manifest.json and resources.json from mocked ARM inventory' {
        [object[]]$fixtureResources =
            @(Get-Content -LiteralPath $script:armFixturePath -Raw -Encoding Utf8 | ConvertFrom-Json)
        $fixtureResources += @(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'fixtures/arm-hidden-resources.sample.json') -Raw -Encoding Utf8 | ConvertFrom-Json)

        [object[]]$mockAzResources =
            @( $fixtureResources | ForEach-Object { New-ArchLucidMockAzResource $_ } )

        Mock Get-Module {
            return $null
        } -ParameterFilter {
            $ListAvailable -and ($null -ne $Name) -and ($Name -contains 'Az.ResourceGraph')
        }

        Mock Get-AzSubscription {
            param([string] $SubscriptionId)

            return [PSCustomObject]@{
                Id = "/subscriptions/$SubscriptionId"
                SubscriptionId = $SubscriptionId
                TenantId = '99999999-8888-7777-6666-555555555555'
                Name = 'Contoso Production'
            }
        }

        Mock Get-AzContext {
            return [PSCustomObject]@{
                Subscription = [PSCustomObject]@{ Id = '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }
                Tenant = [PSCustomObject]@{ Id = '99999999-8888-7777-6666-555555555555' }
                Account = [PSCustomObject]@{ Id = 'ci-extractor-test@contoso.com' }
            }
        }

        Mock Set-AzContext {
            param([string] $SubscriptionId, [string] $Tenant)

            return [PSCustomObject]@{
                Subscription = [PSCustomObject]@{ Id = $SubscriptionId }
                Tenant = [PSCustomObject]@{ Id = $Tenant }
            }
        }

        Mock Get-AzResource {
            return $mockAzResources
        }

        Mock Get-AzPolicyDefinition {
            return @()
        }

        Mock Get-AzPolicyAssignment {
            return @()
        }

        Mock Ensure-ArchLucidAzureSubscriptionSession {
            param([string] $SubscriptionId)

            return $SubscriptionId
        }

        Mock Connect-ArchLucidAzureAccountForSubscription {
        }

        $env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT = '1'
        $env:ARCHLUCID_EXTRACTOR_SKIP_POLICY_COMPLIANCE = '1'

        [string]$outputZip =
            Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-extractor-test-" + [Guid]::NewGuid().ToString('N') + '.zip')

        try
        {
            . $script:extractorScript `
                -SubscriptionId 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' `
                -OutputPath $outputZip

            Test-Path -LiteralPath $outputZip | Should -Be $true

            [string]$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-extractor-read-" + [Guid]::NewGuid().ToString('N'))

            New-Item -ItemType Directory -Path $staging | Out-Null

            try
            {
                Expand-Archive -LiteralPath $outputZip -DestinationPath $staging -Force

                [string]$manifestPath = Join-Path $staging 'manifest.json'
                [string]$resourcesPath = Join-Path $staging 'resources.json'

                Test-Path -LiteralPath $manifestPath | Should -Be $true
                Test-Path -LiteralPath $resourcesPath | Should -Be $true

                [object]$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding Utf8 | ConvertFrom-Json

                $manifest.schemaVersion | Should -Be 2
                $manifest.subscriptionId | Should -Be 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
                $manifest.subscriptionName | Should -Be 'Contoso Production'
                [string]::IsNullOrWhiteSpace($( $manifest.scriptVersion )) | Should -Be $false
                $manifest.extractionTelemetry | Should -Not -BeNullOrEmpty
                $manifest.extractionTelemetry.steps | Should -Not -BeNullOrEmpty
                ($manifest.extractionTelemetry.steps | Where-Object { $_.name -eq 'Inventory' }).Count | Should -Be 1

                [object[]]$resources = @(Get-Content -LiteralPath $resourcesPath -Raw -Encoding Utf8 | ConvertFrom-Json)

                $resources.Count | Should -Be 7
                foreach ($fixtureResource in $fixtureResources)
                {
                    @($resources | Where-Object { $_.resourceId -eq $fixtureResource.resourceId }).Count | Should -Be 1
                }
                [object]$identity = $resources | Where-Object { $_.resourceType -eq 'Microsoft.ManagedIdentity/userAssignedIdentities' }
                $identity.properties.provisioningState | Should -Be 'Succeeded'
                ($identity.properties | ConvertTo-Json -Depth 12) | Should -Not -Match 'fixture-secret'
                [object[]]$preservedAssociations = @(Get-Content -LiteralPath (Join-Path $staging 'network-associations.json') -Raw -Encoding Utf8 | ConvertFrom-Json)
                @($preservedAssociations | Where-Object {
                    $_.associationType -eq 'peToNic' -and
                    $_.fromResourceId -eq '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/resourceGroups/rg-archlucid-demo/providers/Microsoft.Network/privateEndpoints/pe1' -and
                    $_.toResourceId -eq '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/resourceGroups/rg-archlucid-demo/providers/Microsoft.Network/networkInterfaces/pe-nic'
                }).Count | Should -Be 1

                [string]$roleAssignmentsPath = Join-Path $staging 'role-assignments.json'
                [string]$networkAssociationsPath = Join-Path $staging 'network-associations.json'

                Test-Path -LiteralPath $roleAssignmentsPath | Should -Be $true
                Test-Path -LiteralPath $networkAssociationsPath | Should -Be $true

                [object[]]$roleAssignments = @(Get-Content -LiteralPath $roleAssignmentsPath -Raw -Encoding Utf8 | ConvertFrom-Json)
                $roleAssignments.Count | Should -Be 1
                $roleAssignments[0].principalId | Should -Be '11111111-1111-1111-1111-111111111111'

                [string]$roleAssignmentsJson = Get-Content -LiteralPath $roleAssignmentsPath -Raw -Encoding Utf8
                # One role assignment must remain a JSON array; pipeline ConvertTo-Json unwraps a single row to an object.
                $roleAssignmentsJson.Trim().StartsWith('[') | Should -Be $true

                [object[]]$resourceTypes = @( $resources | ForEach-Object { $_.resourceType } )

                ($resourceTypes -contains 'Microsoft.Storage/storageAccounts') | Should -Be $true
                ($resourceTypes -contains 'Microsoft.Compute/virtualMachines') | Should -Be $true

                Test-Path -LiteralPath (Join-Path $staging 'dependency-observations.json') | Should -Be $false
                Test-Path -LiteralPath (Join-Path $staging 'sql-database-principals.json') | Should -Be $false
            }
            finally
            {
                Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        finally
        {
            Remove-Item Env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -ErrorAction SilentlyContinue
            Remove-Item Env:ARCHLUCID_EXTRACTOR_SKIP_POLICY_COMPLIANCE -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $outputZip -Force -ErrorAction SilentlyContinue
        }
    }
}
