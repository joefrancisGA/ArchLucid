#requires -Version 5.1
Set-StrictMode -Version Latest

function New-V1IntegrationDrillRow {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Route,
        [Parameter(Mandatory = $true)][int] $ExpectedStatus,
        [int] $ActualStatus = 0,
        [string] $Disposition = 'HOLD',
        [string] $Detail = '',
        [string] $CorrelationId = '',
        [string] $ProblemType = '',
        [string] $IntegrationModel = ''
    )

    return [ordered]@{
        name              = $Name
        route             = $Route
        expectedStatus    = $ExpectedStatus
        actualStatus      = $ActualStatus
        disposition       = $Disposition
        detail            = $Detail
        correlationId     = $CorrelationId
        problemType       = $ProblemType
        integrationModel  = $IntegrationModel
    }
}

function Get-V1IntegrationDrillCorrelationId {
    param([object] $Headers)

    if ($null -eq $Headers) {
        return ''
    }

    $key = 'X-Correlation-ID'

    if ($Headers.ContainsKey($key)) {
        $value = $Headers[$key]

        if ($value -is [System.Array]) {
            return [string]$value[0]
        }

        return [string]$value
    }

    return ''
}

function Get-V1IntegrationDrillProblemType {
    param([string] $JsonContent)

    if ([string]::IsNullOrWhiteSpace($JsonContent)) {
        return ''
    }

    try {
        $problem = $JsonContent | ConvertFrom-Json -ErrorAction Stop
        return [string]$problem.type
    }
    catch {
        return ''
    }
}

function Get-V1IntegrationDrillProblemCorrelationId {
    param([string] $JsonContent)

    if ([string]::IsNullOrWhiteSpace($JsonContent)) {
        return ''
    }

    try {
        $problem = $JsonContent | ConvertFrom-Json -ErrorAction Stop
        return [string]$problem.correlationId
    }
    catch {
        return ''
    }
}

function Invoke-V1IntegrationDrillHttp {
    param(
        [Parameter(Mandatory = $true)][string] $Uri,
        [ValidateSet('Get', 'Post')]
        [string] $Method = 'Get',
        [string] $Body,
        [string] $ContentType,
        [hashtable] $Headers = @{},
        [int] $TimeoutSec = 120
    )

    $webParams = @{
        Uri             = $Uri
        Method          = $Method
        UseBasicParsing = $true
        TimeoutSec      = $TimeoutSec
    }

    if ($Headers.Count -gt 0) {
        $webParams['Headers'] = $Headers
    }

    if (-not [string]::IsNullOrWhiteSpace($Body)) {
        $webParams['Body'] = $Body
    }

    if (-not [string]::IsNullOrWhiteSpace($ContentType)) {
        $webParams['ContentType'] = $ContentType
    }

    try {
        $response = Invoke-WebRequest @webParams -ErrorAction Stop

        return [ordered]@{
            Ok            = $true
            StatusCode    = [int]$response.StatusCode
            Content       = [string]$response.Content
            Headers       = $response.Headers
            CorrelationId = (Get-V1IntegrationDrillCorrelationId -Headers $response.Headers)
            Error         = $null
        }
    }
    catch {
        $status = 0
        $body = ''
        $responseHeaders = $null
        $message = $_.Exception.Message

        if ($_.Exception.Response) {
            try {
                $httpResponse = $_.Exception.Response
                $status = [int]$httpResponse.StatusCode
                $stream = $httpResponse.GetResponseStream()

                if ($null -ne $stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $body = $reader.ReadToEnd()
                    $reader.Dispose()
                }

                if ($httpResponse.Headers) {
                    $responseHeaders = @{}

                    foreach ($headerKey in $httpResponse.Headers.AllKeys) {
                        $responseHeaders[$headerKey] = $httpResponse.Headers[$headerKey]
                    }
                }
            }
            catch {
                $body = ''
            }
        }

        if ($_.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($_.ErrorDetails.Message)) {
            $body = [string]$_.ErrorDetails.Message
        }

        $correlationId = Get-V1IntegrationDrillCorrelationId -Headers $responseHeaders

        if ([string]::IsNullOrWhiteSpace($correlationId)) {
            $correlationId = Get-V1IntegrationDrillProblemCorrelationId -JsonContent $body
        }

        return [ordered]@{
            Ok            = $false
            StatusCode    = $status
            Content       = $body
            Headers       = $responseHeaders
            CorrelationId = $correlationId
            Error         = $message
        }
    }
}

function Test-V1IntegrationRunCommitted {
    param([object] $RunDetailPayload)

    if ($null -eq $RunDetailPayload) {
        return $false
    }

    $run = $RunDetailPayload.run

    if ($null -eq $run) {
        return $false
    }

    $manifestId = [string]$run.goldenManifestId

    if (-not [string]::IsNullOrWhiteSpace($manifestId)) {
        return $true
    }

    $status = $run.status

    if ($status -eq 5 -or [string]$status -eq 'Committed') {
        return $true
    }

    return $false
}

function Test-V1IntegrationRunReadyForCommit {
    param([object] $RunDetailPayload)

    if ($null -eq $RunDetailPayload) {
        return $false
    }

    $run = $RunDetailPayload.run

    if ($null -eq $run) {
        return $false
    }

    $status = $run.status

    if ($status -eq 4 -or [string]$status -eq 'ReadyForCommit') {
        return $true
    }

    return $false
}

function Resolve-V1IntegrationDrillDisposition {
    param(
        [Parameter(Mandatory = $true)][int] $ExpectedStatus,
        [Parameter(Mandatory = $true)][int] $ActualStatus,
        [string[]] $AllowedStatuses = @()
    )

    if ($ActualStatus -eq $ExpectedStatus) {
        return 'PASS'
    }

    if ($AllowedStatuses.Count -gt 0 -and ($AllowedStatuses -contains $ActualStatus)) {
        return 'WARN'
    }

    return 'HOLD'
}

function Add-V1IntegrationDrillRowFromHttp {
    param(
        [Parameter(Mandatory = $true)][System.Collections.Generic.List[object]] $Rows,
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Route,
        [Parameter(Mandatory = $true)][int] $ExpectedStatus,
        [Parameter(Mandatory = $true)][object] $HttpResult,
        [string[]] $AllowedStatuses = @(),
        [string] $Detail = '',
        [string] $IntegrationModel = ''
    )

    $actual = [int]$HttpResult.StatusCode
    $disposition = Resolve-V1IntegrationDrillDisposition -ExpectedStatus $ExpectedStatus -ActualStatus $actual -AllowedStatuses $AllowedStatuses
    $problemType = ''

    if ($actual -ge 400) {
        $problemType = Get-V1IntegrationDrillProblemType -JsonContent ([string]$HttpResult.Content)
    }

    if ([string]::IsNullOrWhiteSpace($Detail)) {
        if ($disposition -eq 'PASS') {
            $Detail = 'Response matched expected status.'
        }
        else {
            $Detail = if ($null -ne $HttpResult.Error) { [string]$HttpResult.Error } else { "HTTP $actual (expected $ExpectedStatus)." }
        }
    }

    $row = New-V1IntegrationDrillRow `
        -Name $Name `
        -Route $Route `
        -ExpectedStatus $ExpectedStatus `
        -ActualStatus $actual `
        -Disposition $disposition `
        -Detail $Detail `
        -CorrelationId ([string]$HttpResult.CorrelationId) `
        -ProblemType $problemType `
        -IntegrationModel $IntegrationModel

    [void]$Rows.Add($row)
    return $row
}

function Format-V1IntegrationCorrectnessDrillMarkdown {
    param(
        [Parameter(Mandatory = $true)][object] $Report
    )

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('# V1 integration correctness drill')
    $lines.Add('')
    $lines.Add('HTTP happy-path and negative-path checks for documented V1 API semantics (authority pipeline vs legacy coordinator, commit idempotency, Problem Details).')
    $lines.Add('')
    $lines.Add('| Field | Value |')
    $lines.Add('| --- | --- |')
    $lines.Add("| Generated UTC | $($Report.generatedUtc) |")
    $lines.Add("| Base URL | $($Report.baseUrl) |")
    $lines.Add("| Overall disposition | **$($Report.overallDisposition)** |")
    $lines.Add("| Integration model observed | **$($Report.integrationModelObserved)** |")
    $lines.Add("| Run ID | $($Report.runId) |")
    $lines.Add("| Manifest ID | $($Report.manifestId) |")
    $lines.Add("| Coordinator execute invoked | $($Report.coordinatorExecuteInvoked) |")
    $lines.Add('')
    $lines.Add('## Steps')
    $lines.Add('')
    $lines.Add('| Disposition | Step | Route | Expected | Actual | Correlation ID | Problem type | Detail |')
    $lines.Add('| --- | --- | --- | --- | --- | --- | --- | --- |')

    foreach ($row in @($Report.rows)) {
        $corr = if ([string]::IsNullOrWhiteSpace([string]$row.correlationId)) { '-' } else { $row.correlationId }
        $ptype = if ([string]::IsNullOrWhiteSpace([string]$row.problemType)) { '-' } else { $row.problemType }
        $detail = ([string]$row.detail).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
        $lines.Add("| $($row.disposition) | $($row.name) | $($row.route) | $($row.expectedStatus) | $($row.actualStatus) | $corr | $ptype | $detail |")
    }

    $lines.Add('')
    $lines.Add('## References')
    $lines.Add('')
    $lines.Add('- [API_CONTRACTS.md - authority vs coordinator](../../docs/library/API_CONTRACTS.md#architecture-run-authority-pipeline-vs-coordinator-execute--result--commit)')
    $lines.Add('- [V1_RC_DRILL.md](../../docs/library/V1_RC_DRILL.md)')
    $lines.Add('')
    return $lines
}

function Write-V1IntegrationCorrectnessDrillArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $OutputDirectory,
        [Parameter(Mandatory = $true)][object] $Report
    )

    if (-not (Test-Path -LiteralPath $OutputDirectory)) {
        New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    }

    $jsonPath = Join-Path $OutputDirectory 'v1-integration-correctness-drill.json'
    $Report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    $mdPath = Join-Path $OutputDirectory 'v1-integration-correctness-drill.md'
    $mdLines = Format-V1IntegrationCorrectnessDrillMarkdown -Report $Report
    Set-Content -LiteralPath $mdPath -Value $mdLines -Encoding UTF8

    return [ordered]@{
        jsonPath = $jsonPath
        mdPath   = $mdPath
    }
}

function Resolve-V1IntegrationDrillOverallDisposition {
    param([Parameter(Mandatory = $true)][object[]] $Rows)

    $worst = 'PASS'

    foreach ($row in @($Rows)) {
        $candidate = [string]$row.disposition

        if ($candidate -eq 'HOLD') {
            return 'HOLD'
        }

        if ($candidate -eq 'WARN' -and $worst -eq 'PASS') {
            $worst = 'WARN'
        }
    }

    return $worst
}
