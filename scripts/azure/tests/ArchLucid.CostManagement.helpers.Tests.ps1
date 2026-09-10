#Requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1'
Set-StrictMode -Version Latest

BeforeAll {
    [string]$helpersPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.CostManagement.helpers.ps1'
    . $helpersPath
}

Describe 'ArchLucid.CostManagement.helpers' {

    [string[]]$script:CapturedAzRestTailArgs = @()
    [string]$script:CapturedAzRestBodyText = ''

    It 'maps a Cost Management ActualCost-shaped payload to TotalActualCostUsd, BillingPeriod, and BreakdownByServiceName entries' {

        [string]$fixturePath =
            Join-Path $PSScriptRoot 'fixtures\ArchLucid.actual-cost.sample.json'


        [object]$fixtureRoot =
            Get-Content -LiteralPath $fixturePath -Raw -Encoding Utf8 | ConvertFrom-Json


        [object]$mapped =
            ConvertFrom-ArchLucidActualCostManagementJsonResponse `
                -ResponseRoot $fixtureRoot -BillingPeriodLabel 'MonthToDate'


        $mapped.BillingPeriod | Should -Be 'MonthToDate'


        (($mapped.CurrencyCode -like '*USD*') -and ($mapped.CurrencyCode -like '*EUR*')) | Should -Be $true


        [double]::IsNaN([double]$mapped.TotalActualCostUsd) | Should -Be $false


        ([Math]::Round([double]$mapped.TotalActualCostUsd, 6) -eq ([Math]::Round([double]'12.751', 6))) | Should -Be $true


        $mapped.BreakdownByServiceName.Count | Should -Be 2


        [object[]]$names =
            @( $mapped.BreakdownByServiceName | ForEach-Object { $_.ServiceName } )


        ($names -contains 'Azure Storage') | Should -Be $true


        ($names -contains 'Virtual Machines') | Should -Be $true

    }



    It 'aggregates overlapping ServiceName rows across paged payloads' {

        [string]$page1Json =
            '{"properties":{"columns":[{"name":"ServiceName"},{"name":"PreTaxCost"},{"name":"Currency"}],"rows":[["Storage",2,"USD"]]}}'


        [string]$page2Json =
            '{"properties":{"columns":[{"name":"ServiceName"},{"name":"PreTaxCost"},{"name":"Currency"}],"rows":[["storage",3,"USD"],["SQL Database",1,"USD"]]}}'


        [object]$wrap1 = $page1Json | ConvertFrom-Json


        [object]$wrap2 = $page2Json | ConvertFrom-Json



        [object]$merged =
            Merge-ArchLucidPagedCostManagementRowsIntoSummary `
                -Pages @( $wrap1, $wrap2 ) -BillingPeriodLabel 'BillingMonthToDate'


        ([Math]::Round([double]$merged.TotalActualCostUsd, 6) -eq 6.0) | Should -Be $true


        $merged.BreakdownByServiceName.Count | Should -Be 2



        [object]$storageEntry =
            @( $merged.BreakdownByServiceName |

                    Where-Object {

                        ([string]::Equals($( $_.ServiceName ), 'Storage',

                                [System.StringComparison]::OrdinalIgnoreCase))

                    } |

                    Select-Object -First 1 )


        ([double]$storageEntry.PreTaxCost -eq 5.0) | Should -Be $true

    }

    It 'passes CompressedBody when invoking the ActualCost paged query helper' {

        Mock Test-ArchLucidAzureCliRunnable { return $true }

        Mock Invoke-ArchLucidActualCostPagedQuery {
            return @{
                Ok = $true
                StderrCombined = ''
                Pages = @()
            }
        }

        $null = Get-ArchLucidActualCostSummary -SubscriptionId '00000000-0000-0000-0000-000000000001'

        Should -Invoke Invoke-ArchLucidActualCostPagedQuery -Times 1 -ParameterFilter {
            (-not [string]::IsNullOrWhiteSpace($CompressedBody)) -and
            ($CompressedBody -match '"type"\s*:\s*"ActualCost"') -and
            (-not [string]::IsNullOrWhiteSpace($PostUrl)) -and
            (-not [string]::IsNullOrWhiteSpace($DiagTokenForWarnings))
        }
    }

    It 'retries transient 429 az rest failures before succeeding' {

        [int]$script:AzRestAttemptCount = 0

        Mock Invoke-ArchLucidAzureCliAzRestCaptured {

            $script:AzRestAttemptCount++

            if ($script:AzRestAttemptCount -lt 3) {

                return @{
                    Exit = 1
                    Stdout = ''
                    Stderr = 'ERROR: Too Many Requests({"error":{"code":"429","message":"Too many requests. Please retry."}})'
                }
            }

            return @{
                Exit = 0
                Stdout = '{"properties":{"columns":[{"name":"ServiceName"},{"name":"PreTaxCost"},{"name":"Currency"}],"rows":[]}}'
                Stderr = ''
            }
        }

        [hashtable]$result =
            Invoke-ArchLucidAzureCliAzRestRetryable -TailAfterRest @('--method', 'POST', '--url', 'https://example.test/query')

        $result.Exit | Should -Be 0
        $script:AzRestAttemptCount | Should -Be 3
    }

    It 'does not retry 403 az rest failures' {

        [int]$script:AzRestAttemptCount = 0

        Mock Invoke-ArchLucidAzureCliAzRestCaptured {

            $script:AzRestAttemptCount++

            return @{
                Exit = 1
                Stdout = ''
                Stderr = 'ERROR: Forbidden(403) Insufficient access.'
            }
        }

        [hashtable]$result =
            Invoke-ArchLucidAzureCliAzRestRetryable -TailAfterRest @('--method', 'POST', '--url', 'https://example.test/query')

        $result.Exit | Should -Be 1
        $script:AzRestAttemptCount | Should -Be 1
    }

    It 'parses 429 from az rest stderr payloads' {

        [int]$parsed =
            Get-AzureHttpStatusFromAzRestCaptured `
                -ExitCode 1 `
                -Stderr 'ERROR: Too Many Requests({"error":{"code":"429","message":"Too many requests. Please retry."}})'

        $parsed | Should -Be 429
    }

    It 'writes the POST body to a temp file and passes @path to az rest on Windows-safe invocation' {

        $script:CapturedAzRestTailArgs = @()
        $script:CapturedAzRestBodyText = ''

        Mock Invoke-ArchLucidAzureCliAzRestCaptured {
            param([string[]]$TailAfterRest)

            $script:CapturedAzRestTailArgs = @($TailAfterRest)

            [int]$bodyIndex = [array]::IndexOf($TailAfterRest, '--body')

            if ($bodyIndex -ge 0) {

                [string]$bodyArg = $TailAfterRest[$bodyIndex + 1]
                [string]$bodyPath = $bodyArg.TrimStart('@')

                $script:CapturedAzRestBodyText =
                    [System.IO.File]::ReadAllText($bodyPath, [System.Text.UTF8Encoding]::new($false))

            }

            return @{
                Exit = 0
                Stdout = '{"properties":{"columns":[{"name":"ServiceName"},{"name":"PreTaxCost"},{"name":"Currency"}],"rows":[]}}'
                Stderr = ''
            }
        }

        [string]$body =
            New-ArchLucidCostManagementActualCostBodyJson -Timeframe 'MonthToDate'

        [hashtable]$result =
            Invoke-ArchLucidActualCostPagedQuery `
                -PostUrl 'https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000001/providers/Microsoft.CostManagement/query?api-version=2023-03-01' `
                -CompressedBody $body `
                -DiagTokenForWarnings 'test-token'

        $result.Ok | Should -Be $true

        [int]$bodyIndex = [array]::IndexOf($script:CapturedAzRestTailArgs, '--body')

        $bodyIndex | Should -BeGreaterThan 0

        [string]$bodyArg = $script:CapturedAzRestTailArgs[$bodyIndex + 1]

        $bodyArg | Should -Match '^@'

        $script:CapturedAzRestBodyText | Should -Be $body
    }

}