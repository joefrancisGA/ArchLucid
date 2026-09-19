#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ExtractorQuickStart.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.ExtractorQuickStart.helpers.ps1' {

    BeforeAll {
        function Get-AzContext {
            param([switch] $ListAvailable)

            if ($ListAvailable)
            {
                return @()
            }

            return $null
        }
        function Connect-AzAccount { }
        function Disconnect-AzAccount { }
        function Get-AzSubscription { return @() }
        function Set-AzContext { }
        function Get-AzAccessToken { }

        [string]$script:helperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.ExtractorQuickStart.helpers.ps1'
        . $script:helperPath
    }

    It 'formats subscription labels with friendly name and id' {
        $subscription = [PSCustomObject]@{
            Id = '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
            Name = 'Contoso Production'
        }

        Get-ArchLucidAzureSubscriptionSelectionLabel -Subscription $subscription |
            Should -Be 'Contoso Production (aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee)'
    }

    It 'resolves subscription selection by list number, name, or id' {
        [object[]]$subscriptions = @(
            [PSCustomObject]@{
                Id = '/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
                Name = 'Contoso Production'
                TenantId = '99999999-8888-7777-6666-555555555555'
            },
            [PSCustomObject]@{
                Id = '/subscriptions/bbbbbbbb-cccc-dddd-eeee-ffffffffffff'
                Name = 'Contoso Sandbox'
                TenantId = '99999999-8888-7777-6666-555555555555'
            }
        )

        Resolve-ArchLucidAzureSubscriptionSelectionInput -Subscriptions $subscriptions -SelectionInput '2' |
            Should -Be $subscriptions[1]
        Resolve-ArchLucidAzureSubscriptionSelectionInput -Subscriptions $subscriptions -SelectionInput 'Sandbox' |
            Should -Be $subscriptions[1]
        Resolve-ArchLucidAzureSubscriptionSelectionInput -Subscriptions $subscriptions -SelectionInput 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' |
            Should -Be $subscriptions[0]
    }

    It 'selects a subscription interactively and syncs Azure CLI from the Az context' {
        [string]$tenantId = '99999999-8888-7777-6666-555555555555'
        [string]$subscriptionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
        [hashtable]$setContextParams = @{}
        [hashtable]$connectParams = @{}

        Mock Get-AzContext {
            return [PSCustomObject]@{
                Account = [PSCustomObject]@{ Id = 'user@contoso.com' }
                Tenant = [PSCustomObject]@{ Id = $tenantId }
                Subscription = [PSCustomObject]@{ Id = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' }
            }
        }
        Mock Get-AzSubscription {
            return @(
                [PSCustomObject]@{
                    Id = "/subscriptions/$subscriptionId"
                    Name = 'Contoso Production'
                    TenantId = $tenantId
                },
                [PSCustomObject]@{
                    Id = '/subscriptions/bbbbbbbb-cccc-dddd-eeee-ffffffffffff'
                    Name = 'Contoso Sandbox'
                    TenantId = $tenantId
                }
            )
        }
        Mock Connect-AzAccount {
            param($Tenant)

            $connectParams.Tenant = $Tenant
        }
        Mock Set-AzContext {
            param($SubscriptionId, $Tenant)

            $setContextParams.SubscriptionId = $SubscriptionId
            $setContextParams.Tenant = $Tenant
        }
        Mock Get-Command {
            param($Name)

            if ($Name -eq 'az')
            {
                return [PSCustomObject]@{ Source = 'az' }
            }

            return $null
        }
        Mock Get-AzAccessToken {
            return [PSCustomObject]@{ Token = 'test-access-token' }
        }

        function az {
            param([Parameter(ValueFromRemainingArguments = $true)][string[]] $Args)

            if ($Args -contains 'account' -and $Args -contains 'show')
            {
                [string]$currentId = $global:TestAzCurrentSubscriptionId

                if ([string]::IsNullOrWhiteSpace($currentId))
                {
                    $currentId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'
                }

                return ('{"id":"' + $currentId + '"}')
            }

            if ($Args -contains 'account' -and $Args -contains 'set')
            {
                $global:TestAzCurrentSubscriptionId = $subscriptionId

                return ''
            }

            if ($Args -contains 'login')
            {
                $global:TestAzLoginInvoked = $true

                return ''
            }

            return ''
        }

        Mock Resolve-ArchLucidAzureInteractiveAuthenticationMethod { return 'Browser' }
        Mock Read-Host { return '1' }

        $global:TestAzCurrentSubscriptionId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'
        $global:TestAzLoginInvoked = $false

        [string]$resolved = Select-ArchLucidAzureSubscriptionInteractive -TenantId $tenantId

        $resolved | Should -Be $subscriptionId
        $setContextParams.SubscriptionId | Should -Be $subscriptionId
        $setContextParams.Tenant | Should -Be $tenantId
        $global:TestAzLoginInvoked | Should -Be $true
        Should -Not -Invoke Connect-AzAccount
    }

    It 'uses credential authentication when AuthenticationMethod is Credential' {
        [hashtable]$connectParams = @{}

        Mock Connect-AzAccount {
            param($Credential, $Tenant)

            $connectParams.Credential = $Credential
            $connectParams.Tenant = $Tenant
        }

        [PSCredential]$credential = [PSCredential]::new('user@contoso.com', (ConvertTo-SecureString 'secret' -AsPlainText -Force))

        Connect-ArchLucidAzureAccountForSubscription `
            -TenantId '99999999-8888-7777-6666-555555555555' `
            -AuthenticationMethod 'Credential' `
            -Credential $credential

        $connectParams.Credential.UserName | Should -Be 'user@contoso.com'
        $connectParams.Tenant | Should -Be '99999999-8888-7777-6666-555555555555'
    }

    It 'auto-selects the only accessible subscription without prompting' {
        [string]$tenantId = '99999999-8888-7777-6666-555555555555'
        [string]$subscriptionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
        [hashtable]$setContextParams = @{}

        Mock Get-AzContext {
            return $null
        }
        Mock Get-AzSubscription {
            return @(
                [PSCustomObject]@{
                    Id = "/subscriptions/$subscriptionId"
                    Name = 'Contoso Production'
                    TenantId = $tenantId
                }
            )
        }
        Mock Connect-AzAccount { }
        Mock Set-AzContext {
            param($SubscriptionId, $Tenant)

            $setContextParams.SubscriptionId = $SubscriptionId
            $setContextParams.Tenant = $Tenant
        }
        Mock Resolve-ArchLucidAzureInteractiveAuthenticationMethod { return 'Browser' }

        [string]$resolved = Select-ArchLucidAzureSubscriptionInteractive -TenantId $tenantId

        $resolved | Should -Be $subscriptionId
        $setContextParams.SubscriptionId | Should -Be $subscriptionId
    }
}
