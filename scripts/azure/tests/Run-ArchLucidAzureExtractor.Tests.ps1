#Requires -Version 7.0
# Run: Invoke-Pester -EnableExit -Path 'scripts/azure/tests/Run-ArchLucidAzureExtractor.Tests.ps1'
Set-StrictMode -Version Latest

Describe "Run-ArchLucidAzureExtractor.ps1" {

    BeforeAll {
        function Get-AzContext {
            param(
                [switch] $ListAvailable
            )

            if ($ListAvailable)
            {
                return @()
            }

            return $null
        }
        function Connect-AzAccount { }
        function Disconnect-AzAccount { }
        function Get-Module { }
        function Get-AzSubscription { }
        function Set-AzContext { }
        function Get-AzResource { }
        function Get-AzPolicyDefinition { }
        function Get-AzPolicyAssignment { }

        [string]$script:scriptRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:quickStartScript = Join-Path $script:scriptRoot "Run-ArchLucidAzureExtractor.ps1"
        [string]$script:helpersScript = Join-Path $script:scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1"

        [object]$previousModuleAutoLoadingPreference =
            Get-Variable -Name PSModuleAutoLoadingPreference -ValueOnly -ErrorAction SilentlyContinue

        if ($null -eq $previousModuleAutoLoadingPreference)
        {
            $previousModuleAutoLoadingPreference = "All"
        }

        [string]$script:previousModuleAutoLoadingPreference = "$previousModuleAutoLoadingPreference"
        $PSModuleAutoLoadingPreference = "None"

        . $script:helpersScript
        $env:ARCHLUCID_EXTRACTOR_SKIP_AZ_CLI_SYNC = "1"
    }

    AfterAll {
        Set-Variable -Name PSModuleAutoLoadingPreference -Value $script:previousModuleAutoLoadingPreference -Scope Global
        Remove-Item Env:ARCHLUCID_EXTRACTOR_SKIP_AZ_CLI_SYNC -ErrorAction SilentlyContinue
    }

    It "enables cost, retail prices, and app settings hosts by default" {
        [string]$content = Get-Content -LiteralPath $script:quickStartScript -Raw

        $content | Should -Match 'IncludeCost\s*=\s*\$true'
        $content | Should -Match 'IncludeRetailPrices\s*=\s*\$true'
        $content | Should -Match 'IncludeAppSettingsHosts\s*=\s*\$true'
    }

    It "defaults output path to archlucid-azure-package.zip in the current directory" {
        [string]$resolved = Resolve-ArchLucidAzureExtractorOutputPath -OutputPath ""

        $resolved | Should -Be (Join-Path (Get-Location).Path "archlucid-azure-package.zip")
    }

    It "uses an explicit subscription id without calling Connect-AzAccount when SkipConnect is set" {
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        Mock Connect-AzAccount { throw "Connect-AzAccount should not run when -SkipConnect is set." }

        [string]$resolved = Resolve-ArchLucidAzureExtractorSubscriptionId `
            -SubscriptionId $subscriptionId `
            -SkipConnect

        $resolved | Should -Be $subscriptionId
        Should -Not -Invoke Connect-AzAccount
    }

    It "derives subscription id from Get-AzContext when omitted" {
        Mock Get-AzContext {
            return [PSCustomObject]@{
                Account = [PSCustomObject]@{ Id = "user@contoso.com" }
                Subscription = [PSCustomObject]@{
                    Id = "11111111-2222-3333-4444-555555555555"
                }
                Tenant = [PSCustomObject]@{
                    Id = "99999999-8888-7777-6666-555555555555"
                }
            }
        }

        Mock Connect-AzAccount { throw "Connect-AzAccount should not run when context already exists." }

        [string]$resolved = Resolve-ArchLucidAzureExtractorSubscriptionId `
            -SubscriptionId "" `
            -SkipConnect

        $resolved | Should -Be "11111111-2222-3333-4444-555555555555"
        Should -Not -Invoke Connect-AzAccount
    }

    It "signs in with tenant and device authentication when no context exists" {
        [string]$tenantId = "9fe44930-326a-4542-907d-5000c79fc027"
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        [hashtable]$connectParams = @{}

        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @()
            }

            return $null
        }
        Mock Get-AzSubscription { return $null }
        Mock Disconnect-AzAccount { }
        Mock Connect-AzAccount {
            param($Tenant, $Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Tenant = $Tenant
            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }

        [string]$resolved = Resolve-ArchLucidAzureExtractorSubscriptionId `
            -TenantId $tenantId `
            -SubscriptionId $subscriptionId

        $resolved | Should -Be $subscriptionId
        $connectParams.Tenant | Should -Be $tenantId
        $connectParams.Subscription | Should -Be $subscriptionId
        $connectParams.UseDeviceAuthentication | Should -Be $true
    }

    It "re-authenticates when the current tenant does not match TenantId" {
        [string]$tenantId = "9fe44930-326a-4542-907d-5000c79fc027"
        [hashtable]$connectParams = @{}

        Mock Get-AzContext {
            return [PSCustomObject]@{
                Account = [PSCustomObject]@{ Id = "user@contoso.com" }
                Tenant = [PSCustomObject]@{ Id = "11111111-2222-3333-4444-555555555555" }
            }
        }
        Mock Connect-AzAccount {
            param($Tenant, [switch] $UseDeviceAuthentication)

            $connectParams.Tenant = $Tenant
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }

        $null = Ensure-ArchLucidAzureLogin -TenantId $tenantId

        $connectParams.Tenant | Should -Be $tenantId
        $connectParams.UseDeviceAuthentication | Should -Be $true
    }

    It "connects with subscription scope when TenantId is omitted" {
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        [hashtable]$connectParams = @{}

        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @()
            }

            return $null
        }
        Mock Get-AzSubscription { return $null }
        Mock Connect-AzAccount {
            param($Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }
        Mock Disconnect-AzAccount { }

        $null = Ensure-ArchLucidAzureLogin -SubscriptionId $subscriptionId

        $connectParams.Subscription | Should -Be $subscriptionId
        $connectParams.UseDeviceAuthentication | Should -Be $true
    }

    It "disconnects other tenants and sets context when subscription is already accessible" {
        [string]$tenantId = "9fe44930-326a-4542-907d-5000c79fc027"
        [string]$otherTenantId = "11111111-2222-3333-4444-555555555555"
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        [hashtable]$contextParams = @{}
        [hashtable]$disconnectParams = @{}

        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/$subscriptionId"
                TenantId = $tenantId
            }
        }
        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @(
                    [PSCustomObject]@{
                        Account = [PSCustomObject]@{ Id = "user@contoso.com" }
                        Tenant = [PSCustomObject]@{ Id = $tenantId }
                        Subscription = [PSCustomObject]@{ Id = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff" }
                    },
                    [PSCustomObject]@{
                        Account = [PSCustomObject]@{ Id = "user@other.com" }
                        Tenant = [PSCustomObject]@{ Id = $otherTenantId }
                        Subscription = [PSCustomObject]@{ Id = "cccccccc-dddd-eeee-ffff-000000000000" }
                    }
                )
            }

            return [PSCustomObject]@{
                Account = [PSCustomObject]@{ Id = "user@contoso.com" }
                Tenant = [PSCustomObject]@{ Id = $tenantId }
                Subscription = [PSCustomObject]@{ Id = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff" }
            }
        }
        Mock Disconnect-AzAccount {
            param($Username)

            $disconnectParams.Username = $Username
        }
        Mock Set-AzContext {
            param($SubscriptionId, $Tenant)

            $contextParams.SubscriptionId = $SubscriptionId
            $contextParams.Tenant = $Tenant
        }
        Mock Connect-AzAccount { throw "Connect-AzAccount should not run when subscription is already accessible." }

        $null = Ensure-ArchLucidAzureSubscriptionSession -SubscriptionId $subscriptionId -TenantId $tenantId

        $disconnectParams.Username | Should -Be "user@other.com"
        $contextParams.SubscriptionId | Should -Be $subscriptionId
        $contextParams.Tenant | Should -Be $tenantId
        Should -Not -Invoke Connect-AzAccount
    }

    It "signs out stale sessions and reconnects when subscription is not accessible" {
        [string]$tenantId = "9fe44930-326a-4542-907d-5000c79fc027"
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        [hashtable]$connectParams = @{}

        Mock Get-AzSubscription { return $null }
        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @(
                    [PSCustomObject]@{
                        Account = [PSCustomObject]@{ Id = "user@contoso.com" }
                        Tenant = [PSCustomObject]@{ Id = $tenantId }
                    }
                )
            }

            return $null
        }
        Mock Disconnect-AzAccount { }
        Mock Connect-AzAccount {
            param($Tenant, $Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Tenant = $Tenant
            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }

        $null = Ensure-ArchLucidAzureSubscriptionSession `
            -SubscriptionId $subscriptionId `
            -TenantId $tenantId

        $connectParams.Tenant | Should -Be $tenantId
        $connectParams.Subscription | Should -Be $subscriptionId
        $connectParams.UseDeviceAuthentication | Should -Be $true
        Should -Invoke Disconnect-AzAccount -Times 1 -Exactly
    }

    It "connects when Get-AzSubscription throws because no Azure session exists" {
        [string]$subscriptionId = "0966098b-4d6c-4f09-af1b-965bc2a2ad1d"
        [hashtable]$connectParams = @{}

        Mock Get-AzSubscription {
            throw "Run Connect-AzAccount to login."
        }
        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @()
            }

            return $null
        }
        Mock Disconnect-AzAccount { }
        Mock Connect-AzAccount {
            param($Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }

        { $null = Ensure-ArchLucidAzureSubscriptionSession -SubscriptionId $subscriptionId } | Should -Not -Throw

        $connectParams.Subscription | Should -Be $subscriptionId
        $connectParams.UseDeviceAuthentication | Should -Be $true
        Should -Invoke Connect-AzAccount -Times 1 -Exactly
    }

    It "connects when a cached subscription exists but Set-AzContext requires login" {
        [string]$tenantId = "13af8028-bc99-4f21-a8df-6072feb323be"
        [string]$subscriptionId = "0966098b-4d6c-4f09-af1b-965bc2a2ad1d"
        [hashtable]$connectParams = @{}

        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/$subscriptionId"
                TenantId = $tenantId
            }
        }
        Mock Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @()
            }

            return [PSCustomObject]@{
                Subscription = [PSCustomObject]@{ Id = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff" }
                Tenant = [PSCustomObject]@{ Id = "88888888-7777-6666-5555-444444444444" }
            }
        }
        Mock Set-AzContext {
            throw "Run Connect-AzAccount to login."
        }
        Mock Disconnect-AzAccount { }
        Mock Connect-AzAccount {
            param($Tenant, $Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Tenant = $Tenant
            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }

        { $null = Ensure-ArchLucidAzureSubscriptionSession `
            -SubscriptionId $subscriptionId `
            -TenantId $tenantId `
            -AuthenticationMethod Browser } | Should -Not -Throw

        $connectParams.Tenant | Should -Be $tenantId
        $connectParams.Subscription | Should -Be $subscriptionId
        $connectParams.UseDeviceAuthentication | Should -Be $false
        Should -Invoke Connect-AzAccount -Times 1 -Exactly
    }

    It "does not throw when the delegated extractor completes without setting LASTEXITCODE" {
        [string]$fakeExtractor = Join-Path $TestDrive "Get-ArchLucidAzurePackage.ps1"

        Set-Content -LiteralPath $fakeExtractor -Encoding utf8 -Value @'
Write-Output "fake extractor success"
'@

        { & $fakeExtractor } | Should -Not -Throw

        if (Test-Path -Path 'Variable:LASTEXITCODE') {
            exit $LASTEXITCODE
        }

        $true | Should -Be $true
    }

    It "returns a buyer-facing subscription name from Get-AzSubscription" {
        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
                Name = "Contoso Production"
            }
        }

        $name = Resolve-ArchLucidAzureSubscriptionDisplayName -SubscriptionId "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        $name | Should -Be "Contoso Production"
    }

    It "returns null when the Azure name is a GUID" {
        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
                Name = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
            }
        }

        $name = Resolve-ArchLucidAzureSubscriptionDisplayName -SubscriptionId "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        $name | Should -Be $null
    }

    It "returns null when Get-AzSubscription fails" {
        Mock Get-AzSubscription { throw "subscription not found" }

        $name = Resolve-ArchLucidAzureSubscriptionDisplayName -SubscriptionId "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        $name | Should -Be $null
    }
}
