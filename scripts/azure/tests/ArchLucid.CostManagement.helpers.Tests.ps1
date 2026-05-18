#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1'
# Requires: Install-Module Pester -Scope CurrentUser (Pester 3.4 or later).
Set-StrictMode -Version Latest

[string]$helpersPath =
    Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.CostManagement.helpers.ps1'

. $helpersPath

Describe 'ArchLucid.CostManagement.helpers' {

    It 'maps a Cost Management ActualCost-shaped payload to TotalActualCostUsd, BillingPeriod, and BreakdownByServiceName entries' {

        [string]$fixturePath =
            Join-Path $PSScriptRoot 'fixtures\ArchLucid.actual-cost.sample.json'


        [object]$fixtureRoot =
            Get-Content -LiteralPath $fixturePath -Raw -Encoding Utf8 | ConvertFrom-Json


        [object]$mapped =
            ConvertFrom-ArchLucidActualCostManagementJsonResponse `
                -ResponseRoot $fixtureRoot -BillingPeriodLabel 'MonthToDate'


        $mapped.BillingPeriod | Should Be 'MonthToDate'


        (($mapped.CurrencyCode -like '*USD*') -and ($mapped.CurrencyCode -like '*EUR*')) | Should Be $true


        [double]::IsNaN([double]$mapped.TotalActualCostUsd) | Should Be $false


        ([Math]::Round([double]$mapped.TotalActualCostUsd, 6) -eq ([Math]::Round([double]'12.751', 6))) | Should Be $true


        $mapped.BreakdownByServiceName.Count | Should Be 2


        [object[]]$names =
            @( $mapped.BreakdownByServiceName | ForEach-Object { $_.ServiceName } )


        ($names -contains 'Azure Storage') | Should Be $true


        ($names -contains 'Virtual Machines') | Should Be $true

    }



    It 'aggregates overlapping ServiceName rows across paged payloads' {

        # Minimal column descriptor list (ordering is resolved via column **name**, not ordinal here).
        [object]$colsWrapper =
            ('{"columns":[{"name":"ServiceName"},{"name":"PreTaxCost"},{"name":"Currency"}],"rows":[]}' |
                    ConvertFrom-Json)


        [object]$colTemplate = $colsWrapper.columns


        [object]$props1 =
            New-Object PSObject -Property @{
                columns = $colTemplate
                rows =
                    @( @('Storage', [double]'2', 'USD'))
            }



        [object]$wrap1 =
            New-Object PSObject -Property @{ properties = $props1 }


        [object]$props2 =
            New-Object PSObject -Property @{
                columns = $colTemplate
                rows =
                    @( @('storage', [double]'3', 'USD'); @('SQL Database', [double]'1', 'USD'))
            }



        [object]$wrap2 =
            New-Object PSObject -Property @{ properties = $props2 }



        [object]$merged =
            Merge-ArchLucidPagedCostManagementRowsIntoSummary `
                -Pages @( $wrap1, $wrap2 ) -BillingPeriodLabel 'BillingMonthToDate'


        ([Math]::Round([double]$merged.TotalActualCostUsd, 6) -eq 6.0) | Should Be $true


        $merged.BreakdownByServiceName.Count | Should Be 2



        [object]$storageEntry =
            @( $merged.BreakdownByServiceName |

                    Where-Object {

                        ([string]::Equals($( $_.ServiceName ), 'Storage',

                                [System.StringComparison]::OrdinalIgnoreCase))

                    } |

                    Select-Object -First 1 )


        ([double]$storageEntry.PreTaxCost -eq 5.0) | Should Be $true

    }

}
