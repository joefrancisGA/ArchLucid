# ArchLucid - Azure Cost Management helpers for Get-ArchLucidAzurePackage.ps1
#
# Subscription-scoped **Microsoft.CostManagement/query** via **az rest** (Azure CLI core only - no PowerShell Az modules).
# The **costmanagement** extension removed **`az costmanagement query`** starting v0.2.1; this path keeps **ActualCost**
# payloads equivalent to **`--type ActualCost`** on the removed command.
#

Set-StrictMode -Version Latest

function Test-ArchLucidAzureCliRunnable {

    return $null -ne (Get-Command -Name az -ErrorAction SilentlyContinue)
}

function New-ArchLucidCostManagementActualCostBodyJson(

    [ValidateSet('MonthToDate', 'BillingMonthToDate', 'TheLastMonth')]

    [Parameter(Mandatory)][string]$Timeframe) {

    return (@{

            type      = 'ActualCost'

            timeframe = $Timeframe

            dataset   = @{

                granularity = 'None'

                grouping    = @(

                    @{ type = 'Dimension'; name = 'ServiceName' }

                )

                aggregation = @{

                    totalCost = @{ name = 'PreTaxCost'; function = 'Sum' }

                }

            }

        } | ConvertTo-Json -Depth 25 -Compress)
}

function Resolve-ArchLucidCostQueryColumnIndexes([Parameter(Mandatory)][object]$PropertiesPayload) {

    $cols = $PropertiesPayload.columns

    if ($null -eq $cols) {

        throw "Cost Management query response missing properties.columns."
    }

    [string[]]$names = @($cols | ForEach-Object { "$( $_.name )" })

    [int]$preIx = [array]::IndexOf($names, 'PreTaxCost')

    [int]$svcIx = [array]::IndexOf($names, 'ServiceName')

    [int]$curIx = [array]::IndexOf($names, 'Currency')

    if (($preIx -lt 0) -or ($svcIx -lt 0)) {

        throw "Cost Management query payload missing PreTaxCost and/or ServiceName column metadata."
    }

    return [ordered]@{

        PreIx = $preIx

        SvcIx = $svcIx

        CurIx = $curIx

    }
}

function Invoke-ArchLucidAzureCliAzRestCaptured([Parameter(Mandatory)][string[]]$TailAfterRest) {

    [string]$azExe = (Get-Command -Name az -ErrorAction Stop).Source

    [System.Collections.Generic.List[string]]$vector =
        New-Object System.Collections.Generic.List[string]


    [void]$vector.Add('rest')


    foreach ($segment in @($TailAfterRest)) { [void]$vector.Add("$segment") }

    [string]$stdoutPath = Join-Path ([IO.Path]::GetTempPath()) ("alcm-{0:N}.stdout" -f ([Guid]::NewGuid()))

    [string]$stderrPath = Join-Path ([IO.Path]::GetTempPath()) ("alcm-{0:N}.stderr" -f ([Guid]::NewGuid()))

    try {

        $proc = Start-Process `

                -FilePath $azExe `

                -ArgumentList @($vector.ToArray()) `

                -NoNewWindow `

                -Wait `

                -PassThru `

                -RedirectStandardOutput $stdoutPath `

                -RedirectStandardError $stderrPath



        [string]$outCaptured = ''

        [string]$errCaptured = ''

        if (Test-Path -LiteralPath $stdoutPath) {

            $outCaptured = Get-Content -LiteralPath $stdoutPath -Raw

            if ($null -eq $outCaptured) { $outCaptured = '' }
        }

        if (Test-Path -LiteralPath $stderrPath) {

            $errCaptured = Get-Content -LiteralPath $stderrPath -Raw

            if ($null -eq $errCaptured) { $errCaptured = '' }
        }

        [int]$code = [int]$proc.ExitCode



        # Some **az rest** diagnostics land on stderr even with HTTP 403; classify as failure if stderr looks actionable.



        if (($code -eq 0) -and ($errCaptured -match '(?i)ERROR:|Forbidden\(403\)|\(401\)')) {

            $code = 1
        }




        return [ordered]@{


            Exit   = $code


            Stdout = $outCaptured.TrimEnd()


            Stderr = $errCaptured.TrimEnd()


        }

    }



    finally {

        Remove-Item -LiteralPath $stdoutPath -Force -ErrorAction SilentlyContinue



        Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue

    }


}


function Invoke-ArchLucidActualCostPagedQuery(
    [Parameter(Mandatory)][string]$PostUrl,
    [Parameter(Mandatory)][string]$CompressedBody,
    [Parameter(Mandatory)][string]$DiagTokenForWarnings) {

    [System.Collections.Generic.List[object]]$pageObjects =
        New-Object System.Collections.Generic.List[object]

    [string]$cursor = "$PostUrl"
    [bool]$stillPost = $true
    [string]$reuseBody = $CompressedBody

    # URL cycle guard (**nextLink** can repeat catastrophically on misconfiguration).

    [hashtable]$seenUrlsFlags = @{}

    for ($iterationIndex = 0; $iterationIndex -lt 64; $iterationIndex++) {

        if ([string]::IsNullOrWhiteSpace($cursor.Trim())) {

            break

        }


        if ($seenUrlsFlags.ContainsKey($cursor.Trim())) {

            Write-Warning "ArchLucid ActualCost paging stopped due to repeating nextLink (token=$DiagTokenForWarnings)"

            return @{ Ok = $false; StderrCombined = ''; Pages = @() }

        }

        $seenUrlsFlags[$cursor.Trim()] = $true

        [System.Collections.Generic.List[string]]$tailArgs =
            New-Object System.Collections.Generic.List[string]

        [void]$tailArgs.Add('--method')
        [void]$tailArgs.Add($(if ($stillPost) { 'POST' } else { 'GET' }))
        [void]$tailArgs.Add('--url')
        [void]$tailArgs.Add("$cursor")
        [void]$tailArgs.Add('--resource')
        [void]$tailArgs.Add('https://management.azure.com/')

        if ($stillPost) {

            [void]$tailArgs.Add('--headers')
            [void]$tailArgs.Add('Content-Type=application/json')

            if (-not ([string]::IsNullOrWhiteSpace($reuseBody))) {

                [void]$tailArgs.Add('--body')
                [void]$tailArgs.Add($reuseBody)

            }

        }


        try {

            $snippet = Invoke-ArchLucidAzureCliAzRestCaptured -TailAfterRest @($tailArgs.ToArray())

        }

        catch {

            Write-Warning "ArchLucid ActualCost az rest invocation failed: $($_.Exception.Message)"

            return @{ Ok = $false; StderrCombined = $_.Exception.Message; Pages = @() }

        }

        if ($snippet.Exit -ne 0) {

            return @{ Ok = $false; StderrCombined = "$( $snippet.Stderr ) $($snippet.Stdout)".Trim(); Pages = @() }

        }

        try {

            [object]$pageJson = $snippet.Stdout | ConvertFrom-Json

        }

        catch {

            Write-Warning "ArchLucid ActualCost JSON parse failure: $($_.Exception.Message)"

            return @{ Ok = $false; StderrCombined = "$( $snippet.Stdout )"; Pages = @() }

        }

        [void]$pageObjects.Add($pageJson)


        [string]$next = ''
        [object]$layerProbe = $pageJson.properties

        if (($null -ne $layerProbe) -and (($layerProbe.PSObject.Properties.Match('nextLink').Count -gt 0))) {

            [string]$maybeNextLink = "$( $layerProbe.nextLink )".Trim()

            if (-not ([string]::IsNullOrWhiteSpace($maybeNextLink))) {

                $next = $maybeNextLink

            }

        }

        $cursor = "$next"
        $stillPost = $false
        [string]$reuseBody = ''

        if ([string]::IsNullOrWhiteSpace($cursor.Trim())) {

            break

        }

    }

    return @{ Ok = $true; StderrCombined = ''; Pages = @($pageObjects.ToArray()) }

}

function Merge-ArchLucidPagedCostManagementRowsIntoSummary(

    [Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Pages,

    [Parameter(Mandatory)][string]$BillingPeriodLabel) {




    # Select first non-null **columns** block; concatenate **rows** across pages.



    [object]$templateColumns = $null



    [System.Collections.Generic.List[object]]$rowAccumulator =




        New-Object System.Collections.Generic.List[object]


    foreach ($p in @($Pages)) {


        if (($null -eq $p) -or ($null -eq $p.properties)) {




            continue


        }



        if (($null -eq $templateColumns) -and ($null -ne $p.properties.columns)) {




            $templateColumns = $p.properties.columns


        }



        if ($null -ne $p.properties.rows) {


            foreach ($r in @($p.properties.rows)) {




                [void]$rowAccumulator.Add($r)


            }



        }


    }


    [object]$innerProps =




        New-Object PSCustomObject -Property @{


            columns = $templateColumns


            rows    = @($rowAccumulator.ToArray())


        }





    # **PSCustomObject** wrapper




    $wrapped =




        New-Object PSCustomObject -Property @{ properties = $innerProps }



    return (ConvertFrom-ArchLucidActualCostManagementJsonResponse `
            -ResponseRoot $wrapped -BillingPeriodLabel $BillingPeriodLabel)
}

function ConvertFrom-ArchLucidActualCostManagementJsonResponse(



    [Parameter(Mandatory)][object]$ResponseRoot,

    [Parameter(Mandatory)][string]$BillingPeriodLabel) {


    # Public entry for fixtures / tests (exported via module-like dot sourcing).





    [object]$propsNode = $ResponseRoot.properties



    if (($null -eq $propsNode) -or ($null -eq $propsNode.rows)) {




        throw "Cost Management query JSON missing properties.rows."


    }






    # When **Granularity=None** grouping may surface **MeterCategory** synonymously on some CSP rows - keep explicit **ServiceName** query contract.



    $ixMeta = Resolve-ArchLucidCostQueryColumnIndexes -PropertiesPayload $propsNode






    [System.Collections.Generic.Dictionary[string, double]]$bucket =
        New-Object 'System.Collections.Generic.Dictionary[String, Double]' `
            ([System.StringComparer]::OrdinalIgnoreCase)






    [System.Collections.Generic.HashSet[string]]$currencyAccumulator =
        New-Object System.Collections.Generic.HashSet[string] ([System.StringComparer]::OrdinalIgnoreCase)




    foreach ($rowObj in @($propsNode.rows)) {


        [string]$serviceKey = "$( $rowObj[$ixMeta.SvcIx] )"


        [string]$serviceKeyTrim = $serviceKey.Trim()




        if ([string]::IsNullOrWhiteSpace($serviceKeyTrim)) {




            $serviceKeyTrim = '(unset-service-name)'


        }




        [double]$increment = [double]$rowObj[$ixMeta.PreIx]




        if ($bucket.ContainsKey($serviceKeyTrim)) {




            $bucket[$serviceKeyTrim] = [double]$bucket[$serviceKeyTrim] + $increment


        }




        else {




            $bucket[$serviceKeyTrim] = $increment


        }




        if ($ixMeta.CurIx -ge 0) {




            [string]$curToken = "$( $rowObj[$ixMeta.CurIx] )"


            if (-not ([string]::IsNullOrWhiteSpace($curToken))) {




                [void]$currencyAccumulator.Add($curToken.Trim())




            }


        }


    }




    [double]$runningTotal = 0



    foreach ($key in @( $bucket.Keys )) {





        [double]$piece = [double]$bucket[$key]




        $runningTotal += $piece


    }




    [string]$billingCurrencyCodeFragment = ''




    switch ($currencyAccumulator.Count) {


        1 {

            [string]$onlyRaw = @( $currencyAccumulator.ToArray())[0]


            $billingCurrencyCodeFragment = "$( $onlyRaw )"



            break


        }




        0 { break }


        Default {




            $billingCurrencyCodeFragment = @($currencyAccumulator.ToArray()) -join '|'




            break



        }



    }



    if ([string]::IsNullOrWhiteSpace("$billingCurrencyCodeFragment")) {


        $billingCurrencyCodeFragment = 'unknown'


    }




    $orderedBreakdown = @(


        @( $bucket.Keys | Sort-Object) |




            ForEach-Object {


                [ordered]@{


                    ServiceName = $_


                    PreTaxCost  = [double]$bucket[$_]


                }


            }




        )






    # **TotalActualCostUsd** aligns with backlog naming - values are summed **PreTaxCost** in billing currency.



    return [ordered]@{


        TotalActualCostUsd     = [Math]::Round([double]$runningTotal, 6)


        CurrencyCode           = $billingCurrencyCodeFragment


        BillingPeriod          = "$BillingPeriodLabel"


        BreakdownByServiceName = @($orderedBreakdown)


    }

}

function Get-ArchLucidActualCostSummary(




    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$SubscriptionId,

    [ValidateSet('MonthToDate', 'BillingMonthToDate', 'TheLastMonth')]

    [string]$Timeframe = 'MonthToDate') {






    # Returns **ordered** hashtable snapshot on success, **$null** on permission/other soft failures.



    if (-not (Test-ArchLucidAzureCliRunnable)) {




        Write-Warning "ArchLucid 'az' CLI not discovered on PATH; actualCostSummary cannot populate."


        return $null


    }




    [string]$normalizedSub = "$( $SubscriptionId )".Trim()




    [string]$serializedRequest =




        New-ArchLucidCostManagementActualCostBodyJson -Timeframe $Timeframe




    [string]$apiVersionTagged =




        ('https://management.azure.com/subscriptions/{0}/providers/Microsoft.CostManagement/query?api-version=2023-03-01' `
            -f $normalizedSub)




    # Short diagnostic correlator.



    [string]$correlator = ([Guid]::NewGuid().ToString('N'))




    [object]$batch =




        Invoke-ArchLucidActualCostPagedQuery -PostUrl "$apiVersionTagged" `

            -CompressedBody $serializedRequest `

            -DiagTokenForWarnings $correlator




    if (-not ([bool]$batch.Ok)) {


        [string]$trimmedCombined = "$( $batch.StderrCombined )"




        if ($trimmedCombined.Length -gt 1800) {




            $trimmedCombined = $trimmedCombined.Substring(0, 1800)


        }




        Write-Warning ("ArchLucid ActualCost aggregation skipped (correlator={0}). Details: {1}" `
                -f $correlator, $trimmedCombined.Trim())




        return $null




    }



    try {


        return Merge-ArchLucidPagedCostManagementRowsIntoSummary `

                -Pages @($batch.Pages) -BillingPeriodLabel $Timeframe




    }



    catch {




        Write-Warning "ArchLucid ActualCost row merge failed ($($_.Exception.Message)) correlator=$correlator"


        return $null


    }

}

