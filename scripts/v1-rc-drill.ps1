# V1 RC drill: HTTP checks against a running ArchLucid API (two runs, compare, replay, export, diagnostics).
# Does not build, deploy, or start the API. See docs/library/V1_RC_DRILL.md
#
# Authentication:
# - Omit -BearerToken and -ApiKey with no ARCHLUCID_BEARER_TOKEN / ARCHLUCID_API_KEY env for DevelopmentBypass labs (unchanged).
# - -BearerToken <jwt>: sends Authorization: Bearer on script HTTP (Invoke-RestMethod / export download).
# - -ApiKey <key>: sends X-Api-Key on script HTTP and temporarily sets ARCHLUCID_API_KEY for CLI steps
#   (doctor, support-bundle) so /health/diagnostics and other probes match the ApiKey-auth API.
# - Params override env; when params omitted, ARCHLUCID_BEARER_TOKEN / ARCHLUCID_API_KEY are used for HTTP headers.
# - You may pass both headers if your environment expects both (unusual).
param(
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipSupportBundle,
    [switch] $SkipDoctor,
    [string] $BearerToken,
    [string] $ApiKey
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

function Get-V1RcDrillOptionalHeaders
{
    return Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
}

function Invoke-V1RcDrillRestMethod
{
    param(
        [string] $Uri,
        [ValidateSet('Get', 'Post')]
        [string] $Method = 'Get',
        [string] $Body,
        [string] $ContentType,
        [int] $TimeoutSec = 0
    )

    $optionalHeaders = Get-V1RcDrillOptionalHeaders
    $params = @{ Uri = $Uri; Method = $Method }

    if ($optionalHeaders.Count -gt 0) {
        $params['Headers'] = $optionalHeaders
    }

    if (-not [string]::IsNullOrWhiteSpace($Body)) {
        $params['Body'] = $Body
    }

    if (-not [string]::IsNullOrWhiteSpace($ContentType)) {
        $params['ContentType'] = $ContentType
    }

    if ($TimeoutSec -gt 0) {
        $params['TimeoutSec'] = $TimeoutSec
    }

    return Invoke-RestMethod @params
}

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'OperatorDiagnostics.ps1')

$cliProj = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'
$base = $ApiBaseUrl.TrimEnd('/')
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss', [System.Globalization.CultureInfo]::InvariantCulture)

$script:savedApiUrl = $env:ARCHLUCID_API_URL
$script:savedArchLucidApiKey = $env:ARCHLUCID_API_KEY
$script:drillSetApiKeyForCli = (-not [string]::IsNullOrWhiteSpace($ApiKey))

if ($script:drillSetApiKeyForCli) {
    $env:ARCHLUCID_API_KEY = $ApiKey.Trim()
}

function Restore-DrillEnv
{
    if ($script:drillSetApiKeyForCli) {

        if ($null -eq $script:savedArchLucidApiKey -or [string]::IsNullOrWhiteSpace($script:savedArchLucidApiKey)) {
            Remove-Item Env:\ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
        }
        else {
            $env:ARCHLUCID_API_KEY = $script:savedArchLucidApiKey
        }
    }

    if ($null -eq $script:savedApiUrl) { Remove-Item Env:\ARCHLUCID_API_URL -ErrorAction SilentlyContinue }
    else { $env:ARCHLUCID_API_URL = $script:savedApiUrl }
}

function Invoke-DrillRestFailure
{
    param(
        [string] $Stage,
        [System.Management.Automation.ErrorRecord] $ErrorRecord
    )

    $msg = $ErrorRecord.Exception.Message

    if ($ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($ErrorRecord.ErrorDetails.Message)) {
        $msg = $ErrorRecord.ErrorDetails.Message
    }

    Write-OperatorFailureTriage -Stage $Stage -Category 'HttpFailure' `
        -Details @($msg) `
        -NextSteps @(
        'Confirm API is up and -ApiBaseUrl is correct',
        'docs/library/V1_RC_DRILL.md - prerequisites (auth, SQL, DevelopmentBypass vs JWT)',
        'dotnet run --project ArchLucid.Cli -- doctor'
    )
}

function New-V1RcDrillCommittedRun
{
    param(
        [string] $RequestIdSuffix,
        [string] $SystemName
    )

    $requestId = "v1-rc-drill-$RequestIdSuffix-$stamp"
    $description = "RC drill ($RequestIdSuffix) - design a small internal API with basic security and observability for release validation."

    $bodyObj = [ordered]@{
        requestId            = $requestId
        systemName           = $SystemName
        description          = $description
        environment          = 'dev'
        cloudProvider        = 'Azure'
        constraints          = @('Use managed identity where possible')
        requiredCapabilities = @('HTTPS')
    }

    $json = $bodyObj | ConvertTo-Json -Compress -Depth 8

    try {
        $created = Invoke-V1RcDrillRestMethod -Uri "$base/v1/architecture/request" -Method Post -Body $json -ContentType 'application/json'
    }
    catch {
        Invoke-DrillRestFailure -Stage "Create run ($RequestIdSuffix)" -ErrorRecord $_
        exit 1
    }

    $runId = [string] $created.run.runId

    if ([string]::IsNullOrWhiteSpace($runId)) {
        Write-OperatorFailureTriage -Stage "Create run ($RequestIdSuffix)" -Category 'InvalidResponse' `
            -Details @('POST /v1/architecture/request returned no run.runId.') `
            -NextSteps @('Inspect API response body and logs')
        exit 1
    }

    try {
        $null = Invoke-V1RcDrillRestMethod -Uri "$base/v1/architecture/run/$runId/execute" -Method Post
    }
    catch {
        Invoke-DrillRestFailure -Stage "Execute run $runId ($RequestIdSuffix)" -ErrorRecord $_
        exit 1
    }

    try {
        $null = Invoke-V1RcDrillRestMethod -Uri "$base/v1/architecture/run/$runId/commit" -Method Post
    }
    catch {
        Invoke-DrillRestFailure -Stage "Commit run $runId ($RequestIdSuffix)" -ErrorRecord $_
        exit 1
    }

    try {
        $detail = Invoke-V1RcDrillRestMethod -Uri "$base/v1/architecture/run/$runId" -Method Get
    }
    catch {
        Invoke-DrillRestFailure -Stage "GET run $runId ($RequestIdSuffix)" -ErrorRecord $_
        exit 1
    }

    $golden = $detail.run.goldenManifestId

    if ($null -eq $golden -or [string]::IsNullOrWhiteSpace([string] $golden)) {
        Write-OperatorFailureTriage -Stage "Committed run $runId ($RequestIdSuffix)" -Category 'MissingGoldenManifest' `
            -Details @('run.goldenManifestId is null after commit.') `
            -NextSteps @('Check API logs for decisioning / persistence errors')
        exit 1
    }

    $manifestId = [string] $golden

    return [pscustomobject]@{
        RunId      = $runId
        ManifestId = $manifestId
    }
}

try
{
    $script:total = 9
    $script:step = 0

    function Write-DrillPhase([string] $title)
    {
        $script:step++
        Write-OperatorPhaseHeader -Title $title -Step $script:step -Total $script:total
    }

    Write-DrillPhase 'Health + version (live, ready, /version)'

    $liveProbe = Get-ArchLucidHttpProbe -Uri "$base/health/live" -TimeoutSec 15 -Headers (Get-V1RcDrillOptionalHeaders)

    if (-not $liveProbe.Ok -or $liveProbe.StatusCode -ne 200) {
        Write-OperatorFailureTriage -Stage 'GET /health/live' -Category 'LivenessFailure' `
            -Details @("HTTP $($liveProbe.StatusCode); $($liveProbe.Error)") `
            -NextSteps @('Start ArchLucid.Api', 'Verify -ApiBaseUrl')
        exit 1
    }

    $readyProbe = Get-ArchLucidHttpProbe -Uri "$base/health/ready" -TimeoutSec 30 -Headers (Get-V1RcDrillOptionalHeaders)

    if (-not $readyProbe.Ok -or $readyProbe.StatusCode -ne 200) {
        Write-OperatorFailureTriage -Stage 'GET /health/ready' -Category 'ReadinessFailure' `
            -Details @("HTTP $($readyProbe.StatusCode); $($readyProbe.Error)") `
            -NextSteps @('Inspect readiness JSON', 'docs/TROUBLESHOOTING.md - SQL, storage, compliance pack')
        Write-ArchLucidReadinessTimeoutDiagnostics -ApiBaseUrl $ApiBaseUrl -ProbeHeaders (Get-V1RcDrillOptionalHeaders)
        exit 1
    }

    try {
        $ver = Invoke-V1RcDrillRestMethod -Uri "$base/version" -Method Get -TimeoutSec 15
    }
    catch {
        Invoke-DrillRestFailure -Stage 'GET /version' -ErrorRecord $_
        exit 1
    }

    if ($null -eq $ver.informationalVersion) {
        Write-Host 'Warning: /version JSON missing informationalVersion (unexpected).' -ForegroundColor Yellow
    }
    else {
        Write-Host "Version: $($ver.informationalVersion)  commit: $($ver.commitSha)" -ForegroundColor DarkGray
    }

    Write-DrillPhase 'Run A - request, execute, commit'
    $runA = New-V1RcDrillCommittedRun -RequestIdSuffix 'a' -SystemName 'RcDrillServiceA'

    Write-DrillPhase 'Run B - request, execute, commit'
    $runB = New-V1RcDrillCommittedRun -RequestIdSuffix 'b' -SystemName 'RcDrillServiceB'

    Write-DrillPhase "List artifacts for Run A manifest ($($runA.ManifestId))"

    try {
        $artifacts = Invoke-V1RcDrillRestMethod -Uri "$base/v1/artifacts/manifests/$($runA.ManifestId)" -Method Get
    }
    catch {
        Invoke-DrillRestFailure -Stage 'GET /v1/artifacts/manifests/{manifestId}' -ErrorRecord $_
        exit 1
    }

    $artifactCount = @($artifacts).Count

    if ($artifactCount -lt 1) {
        Write-OperatorFailureTriage -Stage 'Artifact list (Run A)' -Category 'NoSynthesizedArtifacts' `
            -Details @("Expected >= 1 artifact descriptor; got $artifactCount.") `
            -NextSteps @('Check synthesis logs for manifest', 'docs/RELEASE_SMOKE.md - Zero artifacts')
        exit 1
    }

    Write-Host "Artifact descriptors (Run A): $artifactCount" -ForegroundColor DarkGray

    Write-DrillPhase 'Compare runs end-to-end (A vs B)'

    $pairUrl = "$base/v1/architecture/run/compare/end-to-end?leftRunId=$([uri]::EscapeDataString($runA.RunId))&rightRunId=$([uri]::EscapeDataString($runB.RunId))"

    try {
        $null = Invoke-V1RcDrillRestMethod -Uri $pairUrl -Method Get
    }
    catch {
        Invoke-DrillRestFailure -Stage 'GET run/compare/end-to-end' -ErrorRecord $_
        exit 1
    }

    Write-DrillPhase 'Authority replay (ReconstructOnly) for Run A'

    $replayBody = (@{ runId = $runA.RunId; mode = 'ReconstructOnly' } | ConvertTo-Json -Compress)

    try {
        $replay = Invoke-V1RcDrillRestMethod -Uri "$base/v1/authority/replay" -Method Post -Body $replayBody -ContentType 'application/json'
    }
    catch {
        Invoke-DrillRestFailure -Stage 'POST /v1/authority/replay' -ErrorRecord $_
        exit 1
    }

    if ($null -eq $replay.validation) {
        Write-Host 'Replay returned 200 but validation object missing (check API version).' -ForegroundColor Yellow
    }

    Write-DrillPhase 'Run export ZIP (Run A)'

    $zipPath = Join-Path ([System.IO.Path]::GetTempPath()) ("v1-rc-drill-export-$stamp.zip")

    try {
        $zipInvokeParams = @{
            Uri             = "$base/v1/artifacts/runs/$($runA.RunId)/export"
            OutFile         = $zipPath
            UseBasicParsing = $true
            TimeoutSec      = 120
        }

        $zipHeaders = Get-V1RcDrillOptionalHeaders

        if ($zipHeaders.Count -gt 0) {
            $zipInvokeParams['Headers'] = $zipHeaders
        }

        Invoke-WebRequest @zipInvokeParams
    }
    catch {
        Invoke-DrillRestFailure -Stage 'GET /v1/artifacts/runs/{runId}/export' -ErrorRecord $_
        exit 1
    }

    if (-not (Test-Path $zipPath)) {
        Write-OperatorFailureTriage -Stage 'Run export ZIP' -Category 'MissingFile' `
            -Details @("Expected file at $zipPath") `
            -NextSteps @('Retry curl; verify ExecuteAuthority / ReadAuthority for export route')
        exit 1
    }

    $len = (Get-Item $zipPath).Length

    if ($len -lt 64) {
        Write-OperatorFailureTriage -Stage 'Run export ZIP' -Category 'EmptyOrTinyZip' `
            -Details @("ZIP size $len bytes - unexpected.") `
            -NextSteps @('Open ZIP; check API logs')
        exit 1
    }

    Write-Host "Export saved: $zipPath ($len bytes)" -ForegroundColor DarkGray

    $env:ARCHLUCID_API_URL = $ApiBaseUrl

    if (-not $SkipDoctor) {
        Write-DrillPhase 'CLI doctor'

        Push-Location $root
        try {
            dotnet run --project $cliProj -- doctor
            if ($LASTEXITCODE -ne 0) {
                Write-OperatorFailureTriage -Stage 'CLI doctor' -Category 'CliExitNonZero' `
                    -Details @("dotnet doctor exited $LASTEXITCODE") `
                    -NextSteps @('Run doctor in a visible console', 'Confirm ARCHLUCID_API_URL')
                exit $LASTEXITCODE
            }
        }
        finally {
            Pop-Location
        }
    }
    else {
        $script:step++
        Write-Host ''
        Write-Host "=== [$($script:step)/$($script:total)] Skipped CLI doctor (-SkipDoctor) ===" -ForegroundColor DarkGray
    }

    if (-not $SkipSupportBundle) {
        Write-DrillPhase 'CLI support-bundle (--zip)'

        $bundleParent = Join-Path ([System.IO.Path]::GetTempPath()) "v1-rc-drill-bundle-$stamp"
        New-Item -ItemType Directory -Path $bundleParent -Force | Out-Null

        Push-Location $root
        try {
            dotnet run --project $cliProj -- support-bundle --zip --output $bundleParent
            if ($LASTEXITCODE -ne 0) {
                Write-OperatorFailureTriage -Stage 'CLI support-bundle' -Category 'CliExitNonZero' `
                    -Details @("support-bundle exited $LASTEXITCODE") `
                    -NextSteps @('Review stderr', 'docs/TROUBLESHOOTING.md')
                exit $LASTEXITCODE
            }
        }
        finally {
            Pop-Location
        }

        Write-Host "Support bundle parent: $bundleParent" -ForegroundColor DarkGray
    }
    else {
        $script:step++
        Write-Host ''
        Write-Host "=== [$($script:step)/$($script:total)] Skipped support-bundle (-SkipSupportBundle) ===" -ForegroundColor DarkGray
    }

    Write-Host ''
    Write-Host 'V1 RC drill completed successfully.' -ForegroundColor Green
    Write-Host "  Run A: $($runA.RunId)  manifest: $($runA.ManifestId)" -ForegroundColor DarkGray
    Write-Host "  Run B: $($runB.RunId)  manifest: $($runB.ManifestId)" -ForegroundColor DarkGray
    exit 0
}
finally
{
    Restore-DrillEnv
}
