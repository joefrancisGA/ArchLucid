#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/azure/tests/Get-ArchLucidAzurePackage.Tests.ps1'
# Requires: Install-Module Pester -Scope CurrentUser (Pester 3.4+ or 5.x; use -Strict for legacy syntax).
Set-StrictMode -Version Latest

# Stub targets for Pester Mock when Az.* modules are installed locally. Without these,
# auto-imported module cmdlets bypass Mock and the test hits live Azure APIs.
function Get-AzSubscription { }
function Set-AzContext { }
function Get-AzResource { }
function Get-AzPolicyDefinition { }
function Get-AzPolicyAssignment { }

Describe 'Get-ArchLucidAzurePackage.ps1' {

    BeforeAll {
        # Pester 5 discovery can run before $PSScriptRoot is populated at script scope.
        [string]$script:scriptRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:extractorScript = Join-Path $script:scriptRoot 'Get-ArchLucidAzurePackage.ps1'
        [string]$script:armFixturePath = Join-Path $PSScriptRoot 'fixtures/arm-resources.sample.json'
        [string]$script:previousModuleAutoLoadingPreference = $PSModuleAutoLoadingPreference
        $PSModuleAutoLoadingPreference = 'None'

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
        $PSModuleAutoLoadingPreference = $script:previousModuleAutoLoadingPreference
    }

    It 'writes a schema-version-1 ZIP with manifest.json and resources.json from mocked ARM inventory' {
        [object[]]$fixtureResources =
            @(Get-Content -LiteralPath $script:armFixturePath -Raw -Encoding Utf8 | ConvertFrom-Json)

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
            }
        }

        Mock Set-AzContext {
            param([string] $SubscriptionId)

            return [PSCustomObject]@{
                Subscription = [PSCustomObject]@{ Id = "/subscriptions/$SubscriptionId" }
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

                $manifest.schemaVersion | Should -Be 1
                $manifest.subscriptionId | Should -Be 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
                [string]::IsNullOrWhiteSpace($( $manifest.scriptVersion )) | Should -Be $false

                [object[]]$resources = @(Get-Content -LiteralPath $resourcesPath -Raw -Encoding Utf8 | ConvertFrom-Json)

                $resources.Count | Should -Be 2

                [object[]]$resourceTypes = @( $resources | ForEach-Object { $_.resourceType } )

                ($resourceTypes -contains 'Microsoft.Storage/storageAccounts') | Should -Be $true
                ($resourceTypes -contains 'Microsoft.Compute/virtualMachines') | Should -Be $true
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
