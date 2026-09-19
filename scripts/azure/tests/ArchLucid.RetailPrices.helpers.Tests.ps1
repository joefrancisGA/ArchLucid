#Requires -Version 7.0
# Run: pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.RetailPrices.helpers.Tests.ps1'"
Set-StrictMode -Version Latest

Describe 'ArchLucid.RetailPrices.helpers.ps1' {

    BeforeAll {
        [string]$script:helperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.RetailPrices.helpers.ps1'
        . $script:helperPath
    }

    It 'accepts retail rows without meterTier under strict mode' {
        $row = [pscustomobject]@{
            currencyCode = 'USD'
            type = 'Consumption'
            meterName = 'Standard Hours'
            unitOfMeasure = '1 Hour'
        }

        Test-ArchLucidRetailConsumptionRow -Row $row | Should -Be $true
    }

    It 'rejects government meter tiers when present' {
        $row = [pscustomobject]@{
            currencyCode = 'USD'
            type = 'Consumption'
            meterTier = 'US Government'
            meterName = 'Standard Hours'
            unitOfMeasure = '1 Hour'
        }

        Test-ArchLucidRetailConsumptionRow -Row $row | Should -Be $false
    }

    It 'matches sku hints without requiring armSkuName' {
        $hints = [Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        [void]$hints.Add('standard_d2s_v3')

        $row = [pscustomobject]@{
            skuName = 'Standard_D2s_v3'
        }

        Match-ArchLucidRetailSkuAgainstHints -Hints $hints -RetailRow $row | Should -Be $true
    }
}
