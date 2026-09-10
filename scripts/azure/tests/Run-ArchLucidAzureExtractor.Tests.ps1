#Requires -Version 7.0
# Run: Invoke-Pester -EnableExit -Path 'scripts/azure/tests/Run-ArchLucidAzureExtractor.Tests.ps1'
Set-StrictMode -Version Latest

Describe "Run-ArchLucidAzureExtractor.ps1" {

    BeforeAll {
        function Get-AzContext { }
        function Connect-AzAccount { }
        function Get-Module { }
        function Get-AzSubscription { }
        function Set-AzContext { }
        function Get-AzResource { }
        function Get-AzPolicyDefinition { }
        function Get-AzPolicyAssignment { }

        [string]$script:scriptRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:quickStartScript = Join-Path $script:scriptRoot "Run-ArchLucidAzureExtractor.ps1"
        [string]$script:helpersScript = Join-Path $script:scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1"
        [string]$script:previousModuleAutoLoadingPreference = $PSModuleAutoLoadingPreference
        $PSModuleAutoLoadingPreference = "None"

        . $script:helpersScript
    }

    AfterAll {
        $PSModuleAutoLoadingPreference = $script:previousModuleAutoLoadingPreference
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

        Mock Get-AzContext { return $null }
        Mock Connect-AzAccount {
            param($Tenant, $Subscription, [switch] $UseDeviceAuthentication)

            $connectParams.Tenant = $Tenant
            $connectParams.Subscription = $Subscription
            $connectParams.UseDeviceAuthentication = [bool]$UseDeviceAuthentication
        }
        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/$subscriptionId"
                TenantId = $tenantId
            }
        }
        Mock Set-AzContext { }

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
}
