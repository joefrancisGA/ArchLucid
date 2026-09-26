#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.RetailPrices.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.RetailPrices.helpers.ps1' {

    BeforeAll {
        [string]$script:helperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.RetailPrices.helpers.ps1'
        . $script:helperPath
    }

    It 'accepts consumption rows that omit meterTier' {
        $row = [pscustomobject]@{
            currencyCode = 'USD'
            type = 'Consumption'
            meterName = 'D2 v3'
            unitOfMeasure = '1 Hour'
        }

        { Test-ArchLucidRetailConsumptionRow -Row $row } | Should -Not -Throw
        Test-ArchLucidRetailConsumptionRow -Row $row | Should -BeTrue
    }

    It 'does not emit per-category object counts for SecurityInventory completion' {
        $secureNowContent = Get-Content `
            -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'Get-SecureNowAzurePackage.ps1') `
            -Raw
        $archLucidContent = Get-Content `
            -LiteralPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'Get-ArchLucidAzurePackage.ps1') `
            -Raw

        $secureNowContent | Should -Match 'objectCount\s*='
        $archLucidContent | Should -Match 'objectCount\s*='
        $secureNowContent | Should -Not -Match 'roleAssignmentCount\s*='
        $secureNowContent | Should -Not -Match 'adfDataflowCount\s*='
        $archLucidContent | Should -Not -Match 'roleAssignmentCount\s*='
        $archLucidContent | Should -Not -Match 'adfDataflowCount\s*='
    }
}
