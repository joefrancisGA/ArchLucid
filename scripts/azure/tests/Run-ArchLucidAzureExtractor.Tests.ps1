#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/azure/tests/Run-ArchLucidAzureExtractor.Tests.ps1'
Set-StrictMode -Version Latest

function Get-AzContext { }
function Connect-AzAccount { }
function Get-Module { }
function Get-AzSubscription { }
function Set-AzContext { }
function Get-AzResource { }
function Get-AzPolicyDefinition { }
function Get-AzPolicyAssignment { }

Describe "Run-ArchLucidAzureExtractor.ps1" {

    BeforeAll {
        [string]$script:scriptRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:quickStartScript = Join-Path $script:scriptRoot "Run-ArchLucidAzureExtractor.ps1"
        [string]$script:helpersScript = Join-Path $script:scriptRoot "ArchLucid.ExtractorQuickStart.helpers.ps1"
        [string]$script:previousModuleAutoLoadingPreference = $PSModuleAutoLoadingPreference
        $PSModuleAutoLoadingPreference = "None"
    }

    AfterAll {
        $PSModuleAutoLoadingPreference = $script:previousModuleAutoLoadingPreference
    }

    It "defaults output path to archlucid-azure-package.zip in the current directory" {
        . $script:helpersScript

        [string]$resolved = Resolve-ArchLucidAzureExtractorOutputPath -OutputPath ""

        $resolved | Should -Be (Join-Path (Get-Location).Path "archlucid-azure-package.zip")
    }

    It "uses an explicit subscription id without calling Connect-AzAccount" {
        . $script:helpersScript

        [string]$subscriptionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

        Mock Connect-AzAccount { throw "Connect-AzAccount should not run when -SubscriptionId is supplied." }

        [string]$resolved = Resolve-ArchLucidAzureExtractorSubscriptionId `
            -SubscriptionId $subscriptionId `
            -SkipConnect

        $resolved | Should -Be $subscriptionId
        Should -Not -Invoke Connect-AzAccount
    }

    It "derives subscription id from Get-AzContext when omitted" {
        . $script:helpersScript

        Mock Get-AzContext {
            return [PSCustomObject]@{
                Subscription = [PSCustomObject]@{
                    Id = "11111111-2222-3333-4444-555555555555"
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
}
