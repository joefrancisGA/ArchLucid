#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-RealLlmEvidenceGateDisposition {
    param(
        [Parameter(Mandatory = $true)][bool] $CredentialsPresent,
        [Parameter(Mandatory = $true)][int] $DotnetExitCode,
        [object[]] $EvidenceRows = @(),
        [object] $TopologyMetrics = $null,
        [object] $PipelineMetrics = $null
    )

    if (-not $CredentialsPresent) {
        return 'SKIPPED_NO_CREDENTIALS'
    }

    if ($DotnetExitCode -ne 0) {
        return 'HOLD'
    }

    $failedRows = @($EvidenceRows | Where-Object { $_.Result -eq 'Failed' })

    if ($failedRows.Count -gt 0) {
        return 'HOLD'
    }

    if ($null -eq $TopologyMetrics -or $null -eq $PipelineMetrics) {
        return 'HOLD'
    }

    return 'PASS'
}

function Test-RealLlmEvidenceGateShouldExitNonZero {
    param(
        [Parameter(Mandatory = $true)][string] $Disposition
    )

    return $Disposition -eq 'HOLD'
}

function New-RealLlmEvidenceGateJsonPayload {
    param(
        [Parameter(Mandatory = $true)][string] $GeneratedUtc,
        [Parameter(Mandatory = $true)][string] $Disposition,
        [Parameter(Mandatory = $true)][bool] $CredentialsPresent,
        [Parameter(Mandatory = $true)][int] $DotnetExitCode,
        [Parameter(Mandatory = $true)][object[]] $Checks,
        [string] $TopologyMetricsRelativePath = $null,
        [string] $PipelineMetricsRelativePath = $null,
        [object] $TopologyMetrics = $null,
        [object] $PipelineMetrics = $null
    )

    $payload = [ordered]@{
        schema              = 'archlucid.real-llm-evidence-gate.v2'
        generatedUtc        = $GeneratedUtc
        disposition         = $Disposition
        credentialsPresent  = $CredentialsPresent
        dotnetExitCode      = $DotnetExitCode
        topologyMetricsPath = $TopologyMetricsRelativePath
        pipelineMetricsPath = $PipelineMetricsRelativePath
        checks              = @(
            foreach ($check in $Checks) {
                @{ name = $check.Check; result = $check.Result; detail = $check.Detail }
            }
        )
    }

    if ($null -ne $TopologyMetrics) {
        $payload['topologyProfile'] = ConvertTo-RealLlmProfileSummary -Metrics $TopologyMetrics
    }

    if ($null -ne $PipelineMetrics) {
        $payload['fullPipelineProfile'] = ConvertTo-RealLlmProfileSummary -Metrics $PipelineMetrics
    }

    return $payload
}

function ConvertTo-RealLlmProfileSummary {
    param([Parameter(Mandatory = $true)][object] $Metrics)

    return [ordered]@{
        liveEvidenceProfile         = [string]$Metrics.liveEvidenceProfile
        deploymentName              = [string]$Metrics.deploymentName
        parseAttempts               = [int]$Metrics.parseAttempts
        parseFailures               = [int]$Metrics.parseFailures
        mergeSuccess                = [bool]$Metrics.mergeSuccess
        manifestServiceCount        = [int]$Metrics.manifestServiceCount
        decisionsCount              = [int]$Metrics.decisionsCount
        totalClaims                 = [int]$Metrics.totalClaims
        inputTokensTotal            = [int]$Metrics.inputTokensTotal
        outputTokensTotal           = [int]$Metrics.outputTokensTotal
        estimatedCostUsd            = $Metrics.estimatedCostUsd
        evidenceRefsObserved        = [bool]$Metrics.evidenceRefsObserved
        durableSqlPersistenceExercised = [bool]$Metrics.durableSqlPersistenceExercised
    }
}
