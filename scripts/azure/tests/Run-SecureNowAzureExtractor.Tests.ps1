#Requires -Version 7.0
# Run: Invoke-Pester -EnableExit -Path 'scripts/azure/tests/Run-SecureNowAzureExtractor.Tests.ps1'
Set-StrictMode -Version Latest

Describe "Run-SecureNowAzureExtractor.ps1" {

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
        [string]$script:quickStartScript = Join-Path $script:scriptRoot "Run-SecureNowAzureExtractor.ps1"
        [string]$script:helpersScript = Join-Path $script:scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1"
        [string]$script:previousModuleAutoLoadingPreference = $PSModuleAutoLoadingPreference
        $PSModuleAutoLoadingPreference = "None"

        . $script:helpersScript
    }

    AfterAll {
        $PSModuleAutoLoadingPreference = $script:previousModuleAutoLoadingPreference
    }

    It "defaults output path to securenow-azure-package.zip in the current directory" {
        [string]$resolved = Resolve-SecureNowAzureExtractorOutputPath -OutputPath ""

        $resolved | Should -Be (Join-Path (Get-Location).Path "securenow-azure-package.zip")
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

    It "sets subscription context with tenant when TenantId is supplied" {
        [string]$tenantId = "9fe44930-326a-4542-907d-5000c79fc027"
        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
        [hashtable]$contextParams = @{}

        Mock Get-AzSubscription {
            return [PSCustomObject]@{
                Id = "/subscriptions/$subscriptionId"
                TenantId = $tenantId
            }
        }
        Mock Set-AzContext {
            param($SubscriptionId, $Tenant)

            $contextParams.SubscriptionId = $SubscriptionId
            $contextParams.Tenant = $Tenant
        }

        $null = Set-ArchLucidAzureExtractorSubscriptionContext `
            -SubscriptionId $subscriptionId `
            -TenantId $tenantId

        $contextParams.SubscriptionId | Should -Be "/subscriptions/$subscriptionId"
        $contextParams.Tenant | Should -Be $tenantId
    }
}
