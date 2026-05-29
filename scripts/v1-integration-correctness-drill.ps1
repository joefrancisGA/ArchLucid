#requires -Version 5.1
<#
.SYNOPSIS
  V1 integration correctness drill against a running ArchLucid API.

.DESCRIPTION
  Exercises the documented API happy path (create, lifecycle, commit idempotency,
  artifacts, explain aggregate, first-value report) and negative Problem Details probes.
  Emits PASS/WARN/HOLD rows with route, status, correlation id, and integration model notes.
  See docs/library/V1_INTEGRATION_CORRECTNESS_DRILL.md
#>
param(
    [string] $ApiBaseUrl = '',
    [string] $OutputDirectory = 'artifacts/v1-integration-correctness-drill',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [int] $ReadyPollSeconds = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')
. (Join-Path $PSScriptRoot 'V1IntegrationCorrectnessDrill.ps1')

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $ApiBaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $ApiBaseUrl = 'http://localhost:5128'
}

$base = $ApiBaseUrl.Trim().TrimEnd('/')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$timestamp = [DateTime]::UtcNow.ToString('o', [System.Globalization.CultureInfo]::InvariantCulture)
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss', [System.Globalization.CultureInfo]::InvariantCulture)
$rows = [System.Collections.Generic.List[object]]::new()
$integrationModelObserved = 'unknown'
$coordinatorExecuteInvoked = $false
$runId = ''
$manifestId = ''

function Get-RunDetail {
    param([Parameter(Mandatory = $true)][string] $Id)

    $uri = "$base/v1/architecture/run/$Id"
    return Invoke-V1IntegrationDrillHttp -Uri $uri -Method Get -Headers $headers
}

Write-Host "V1 integration correctness drill @ $base"
Write-Host "Output: $OutputDirectory"

$ready = Invoke-V1IntegrationDrillHttp -Uri "$base/health/ready" -Method Get -Headers $headers -TimeoutSec 30
$null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'health-ready' -Route 'GET /health/ready' -ExpectedStatus 200 -HttpResult $ready

if ($ready.StatusCode -ne 200) {
    $report = [ordered]@{
        formatVersion           = '1.0'
        generatedUtc            = $timestamp
        baseUrl                 = $base
        overallDisposition      = 'HOLD'
        integrationModelObserved = 'not-started'
        runId                   = $null
        manifestId              = $null
        coordinatorExecuteInvoked = $false
        rows                    = @($rows)
    }

    $paths = Write-V1IntegrationCorrectnessDrillArtifacts -OutputDirectory $OutputDirectory -Report $report
    Write-Host "Wrote $($paths.mdPath)"
    exit 1
}

$requestId = "v1-integration-drill-$stamp"
$createBody = [ordered]@{
    requestId            = $requestId
    systemName           = 'IntegrationDrillService'
    description          = 'V1 integration correctness drill - minimal internal API review for contract validation.'
    environment          = 'dev'
    cloudProvider        = 'Azure'
    constraints          = @('Use managed identity where possible')
    requiredCapabilities = @('HTTPS')
} | ConvertTo-Json -Compress -Depth 8

$create = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/architecture/request" -Method Post -Body $createBody -ContentType 'application/json' -Headers $headers
$null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'create-architecture-request' -Route 'POST /v1/architecture/request' -ExpectedStatus 200 -HttpResult $create -AllowedStatuses @(201)

if ($create.StatusCode -lt 200 -or $create.StatusCode -ge 300) {
    $report = [ordered]@{
        formatVersion             = '1.0'
        generatedUtc              = $timestamp
        baseUrl                   = $base
        overallDisposition        = 'HOLD'
        integrationModelObserved  = 'not-started'
        runId                     = $null
        manifestId                = $null
        coordinatorExecuteInvoked = $false
        rows                      = @($rows)
    }

    $paths = Write-V1IntegrationCorrectnessDrillArtifacts -OutputDirectory $OutputDirectory -Report $report
    Write-Host "Wrote $($paths.mdPath)"
    exit 1
}

$created = $create.Content | ConvertFrom-Json -ErrorAction Stop
$runId = [string]$created.run.runId

if ([string]::IsNullOrWhiteSpace($runId)) {
    $rows.Add((New-V1IntegrationDrillRow -Name 'create-architecture-request-parse' -Route 'POST /v1/architecture/request' -ExpectedStatus 200 -ActualStatus $create.StatusCode -Disposition 'HOLD' -Detail 'Response missing run.runId.' -CorrelationId $create.CorrelationId)) | Out-Null
}
else {
    $afterCreate = Get-RunDetail -Id $runId
    $afterCreatePayload = $null

    if ($afterCreate.StatusCode -eq 200) {
        $afterCreatePayload = $afterCreate.Content | ConvertFrom-Json -ErrorAction Stop
    }

    $committedAfterCreate = Test-V1IntegrationRunCommitted -RunDetailPayload $afterCreatePayload

    if (-not $committedAfterCreate) {
        $deadline = (Get-Date).AddSeconds($ReadyPollSeconds)

        while ((Get-Date) -lt $deadline) {
            $poll = Get-RunDetail -Id $runId

            if ($poll.StatusCode -eq 200) {
                $pollPayload = $poll.Content | ConvertFrom-Json -ErrorAction Stop

                if (Test-V1IntegrationRunCommitted -RunDetailPayload $pollPayload) {
                    $committedAfterCreate = $true
                    $afterCreatePayload = $pollPayload
                    break
                }

                if (Test-V1IntegrationRunReadyForCommit -RunDetailPayload $pollPayload) {
                    $afterCreatePayload = $pollPayload
                    break
                }
            }

            Start-Sleep -Seconds 2
        }
    }

    if ($committedAfterCreate) {
        $integrationModelObserved = 'authority-pipeline'
        $manifestId = [string]$afterCreatePayload.run.goldenManifestId
        $detail = 'Run committed without coordinator execute - authority pipeline semantics (create or async finalize).'
        $rows.Add((New-V1IntegrationDrillRow -Name 'classify-lifecycle-model' -Route "GET /v1/architecture/run/$runId" -ExpectedStatus 200 -ActualStatus 200 -Disposition 'PASS' -Detail $detail -CorrelationId $afterCreate.CorrelationId -IntegrationModel $integrationModelObserved)) | Out-Null
    }
    else {
        $integrationModelObserved = 'legacy-coordinator'
        $coordinatorExecuteInvoked = $true
        $execute = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/architecture/run/$runId/execute" -Method Post -Headers $headers
        $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'coordinator-execute' -Route "POST /v1/architecture/run/$runId/execute" -ExpectedStatus 200 -HttpResult $execute -IntegrationModel $integrationModelObserved

        $deadline = (Get-Date).AddSeconds($ReadyPollSeconds)
        $readyForCommit = $false

        while ((Get-Date) -lt $deadline) {
            $poll = Get-RunDetail -Id $runId

            if ($poll.StatusCode -eq 200) {
                $pollPayload = $poll.Content | ConvertFrom-Json -ErrorAction Stop

                if (Test-V1IntegrationRunCommitted -RunDetailPayload $pollPayload) {
                    $readyForCommit = $true
                    $manifestId = [string]$pollPayload.run.goldenManifestId
                    break
                }

                if (Test-V1IntegrationRunReadyForCommit -RunDetailPayload $pollPayload) {
                    $readyForCommit = $true
                    break
                }
            }

            Start-Sleep -Seconds 2
        }

        if (-not $readyForCommit) {
            $rows.Add((New-V1IntegrationDrillRow -Name 'poll-ready-for-commit' -Route "GET /v1/architecture/run/$runId" -ExpectedStatus 200 -ActualStatus 0 -Disposition 'HOLD' -Detail "Run did not reach ReadyForCommit or Committed within $ReadyPollSeconds seconds.")) | Out-Null
        }
        else {
            $rows.Add((New-V1IntegrationDrillRow -Name 'classify-lifecycle-model' -Route "GET /v1/architecture/run/$runId" -ExpectedStatus 200 -ActualStatus 200 -Disposition 'PASS' -Detail 'Coordinator execute required before commit - legacy coordinator semantics.' -IntegrationModel $integrationModelObserved)) | Out-Null
        }
    }

    if (-not (Test-V1IntegrationRunCommitted -RunDetailPayload $afterCreatePayload) -and $coordinatorExecuteInvoked) {
        $firstCommit = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/architecture/run/$runId/commit" -Method Post -Headers $headers
        $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'commit-run-initial' -Route "POST /v1/architecture/run/$runId/commit" -ExpectedStatus 200 -HttpResult $firstCommit -IntegrationModel $integrationModelObserved

        if ($firstCommit.StatusCode -eq 200) {
            $commitPayload = $firstCommit.Content | ConvertFrom-Json -ErrorAction Stop

            if ($null -ne $commitPayload.manifest -and $null -ne $commitPayload.manifest.metadata) {
                $manifestId = [string]$commitPayload.manifest.metadata.manifestId
            }
        }
    }

    $detailAfterCommit = Get-RunDetail -Id $runId

    if ($detailAfterCommit.StatusCode -eq 200) {
        $detailPayload = $detailAfterCommit.Content | ConvertFrom-Json -ErrorAction Stop
        $manifestId = [string]$detailPayload.run.goldenManifestId
    }

    if (-not [string]::IsNullOrWhiteSpace($manifestId)) {
        $retryCommit = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/architecture/run/$runId/commit" -Method Post -Headers $headers
        $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'commit-run-idempotent-retry' -Route "POST /v1/architecture/run/$runId/commit" -ExpectedStatus 200 -HttpResult $retryCommit -Detail 'Second commit must be idempotent (200) per API_CONTRACTS.' -IntegrationModel $integrationModelObserved

        $artifactRoute = "GET /v1/artifacts/manifests/$manifestId"
        $artifacts = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/artifacts/manifests/$manifestId" -Method Get -Headers $headers
        $artifactRow = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'list-artifacts' -Route $artifactRoute -ExpectedStatus 200 -HttpResult $artifacts -IntegrationModel $integrationModelObserved

        if ($artifacts.StatusCode -eq 200) {
            $artifactList = @($artifacts.Content | ConvertFrom-Json -ErrorAction Stop)

            if ($artifactList.Count -gt 0) {
                $first = $artifactList[0]
                $artifactId = [string]$first.artifactId

                if (-not [string]::IsNullOrWhiteSpace($artifactId)) {
                    $descriptorRoute = "GET /v1/artifacts/manifests/$manifestId/artifact/$artifactId/descriptor"
                    $descriptor = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/artifacts/manifests/$manifestId/artifact/$artifactId/descriptor" -Method Get -Headers $headers
                    $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'artifact-descriptor-metadata' -Route $descriptorRoute -ExpectedStatus 200 -HttpResult $descriptor -IntegrationModel $integrationModelObserved
                }
            }
            elseif ($artifactRow.disposition -eq 'PASS') {
                $rows.Add((New-V1IntegrationDrillRow -Name 'list-artifacts-nonempty' -Route $artifactRoute -ExpectedStatus 200 -ActualStatus 200 -Disposition 'WARN' -Detail 'Artifact list is empty; commit succeeded but no synthesized descriptors.')) | Out-Null
            }
        }

        $explain = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/explain/runs/$runId/aggregate" -Method Get -Headers $headers
        $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'explain-aggregate' -Route "GET /v1/explain/runs/$runId/aggregate" -ExpectedStatus 200 -HttpResult $explain -IntegrationModel $integrationModelObserved

        $firstValue = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/pilots/runs/$runId/first-value-report" -Method Get -Headers $headers
        $null = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'first-value-report' -Route "GET /v1/pilots/runs/$runId/first-value-report" -ExpectedStatus 200 -HttpResult $firstValue -IntegrationModel $integrationModelObserved
    }
    else {
        $rows.Add((New-V1IntegrationDrillRow -Name 'committed-manifest-required' -Route "GET /v1/architecture/run/$runId" -ExpectedStatus 200 -ActualStatus 0 -Disposition 'HOLD' -Detail 'goldenManifestId missing; cannot run artifact/explain/first-value steps.')) | Out-Null
    }
}

$missingRunId = '00000000-0000-0000-0000-000000000099'
$missingRun = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/architecture/run/$missingRunId" -Method Get -Headers $headers
$missingRunRow = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'problem-run-not-found' -Route "GET /v1/architecture/run/$missingRunId" -ExpectedStatus 404 -HttpResult $missingRun

if ($missingRunRow.disposition -eq 'PASS' -and $missingRunRow.problemType -notlike '*run-not-found*') {
    $missingRunRow.disposition = 'WARN'
    $missingRunRow.detail = "Expected problem type containing run-not-found; got '$($missingRunRow.problemType)'."
    $rows[$rows.Count - 1] = $missingRunRow
}

$missingManifestId = '00000000-0000-0000-0000-000000000098'
$missingManifestRoute = "GET /v1/artifacts/manifests/$missingManifestId"
$missingManifest = Invoke-V1IntegrationDrillHttp -Uri "$base/v1/artifacts/manifests/$missingManifestId" -Method Get -Headers $headers
$missingManifestRow = Add-V1IntegrationDrillRowFromHttp -Rows $rows -Name 'problem-manifest-not-found' -Route $missingManifestRoute -ExpectedStatus 404 -HttpResult $missingManifest

if ($missingManifestRow.disposition -eq 'PASS' -and $missingManifestRow.problemType -notlike '*manifest-not-found*' -and $missingManifestRow.problemType -notlike '*resource-not-found*') {
    $missingManifestRow.disposition = 'WARN'
    $missingManifestRow.detail = "Expected manifest-not-found or resource-not-found problem type; got '$($missingManifestRow.problemType)'."
    $rows[$rows.Count - 1] = $missingManifestRow
}

$overall = Resolve-V1IntegrationDrillOverallDisposition -Rows @($rows)
$report = [ordered]@{
    formatVersion             = '1.0'
    generatedUtc              = $timestamp
    baseUrl                   = $base
    overallDisposition        = $overall
    integrationModelObserved  = $integrationModelObserved
    runId                     = if ([string]::IsNullOrWhiteSpace($runId)) { $null } else { $runId }
    manifestId                = if ([string]::IsNullOrWhiteSpace($manifestId)) { $null } else { $manifestId }
    coordinatorExecuteInvoked = $coordinatorExecuteInvoked
    rows                      = @($rows)
}

$paths = Write-V1IntegrationCorrectnessDrillArtifacts -OutputDirectory $OutputDirectory -Report $report
Write-Host "Wrote $($paths.mdPath)"
Write-Host "Overall: $overall"

if ($overall -eq 'HOLD') {
    exit 1
}

exit 0
