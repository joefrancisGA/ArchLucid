#Requires -Version 7.0
<#
.SYNOPSIS
    Measures end-to-end time from architecture request to committed manifest via the public HTTP API.

.DESCRIPTION
    This script is a thin client-only benchmark. It:
      1) POST /v1/architecture/request  (Contoso retail sample brief)
      2) POST /v1/architecture/run/{runId}/execute  (best-effort; matches archlucid try — needed so runs reach ReadyForCommit)
         - Real mode: adds header X-ArchLucid-Pilot-Try-Real-Mode: 1 (pilot / first-real-value telemetry; see docs/library/FIRST_REAL_VALUE.md)
      3) GET  /v1/architecture/run/{runId}  (poll until status is ReadyForCommit, or timeout)
      4) POST /v1/architecture/run/{runId}/commit

    Modes (what you are measuring — you must start the API accordingly):
      - Simulator: API running with simulator / demo stack; execute is called without the pilot real-mode header.
      - Real: same flow, but execute is called WITH the pilot header. The host should be the real-AOAI stack (e.g. docker compose with docker-compose.real-aoai.yml) with AgentExecution__Mode=Real and Azure OpenAI env set.

    Prerequisites:
      - ArchLucid API is up and reachable (e.g. http://127.0.0.1:5000 after demo-start / docker).
      - Auth: if your deployment requires it, set ARCHLUCID_API_KEY (sent as X-Api-Key). Connection string / SQL apply to the API host, not to this script.
      - For Real: AZURE_OPENAI_* and stack configured per docs/library/FIRST_REAL_VALUE.md; the API container must already be running in real mode (this script does not flip compose overlays). The CLI uses ARCHLUCID_REAL_AOAI=1 as a local safety gate; start the real-AOAI stack the same way you do for `archlucid try --real` before running this script in -Mode Real.

    Environment:
      - ARCHLUCID_API_BASE_URL: default base URL if -BaseUrl is omitted (falls back to http://127.0.0.1:5000).

    Output JSON (single run) fields: mode, totalMs, requestMs, executionMs, commitMs, runId, timestamp.
    When -Repeat > 1, the root object has repeatCount, totalMsStats (min/max/avg), and runs (array of per-run objects).
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Simulator", "Real")]
    [string] $Mode,

    [string] $BaseUrl = $env:ARCHLUCID_API_BASE_URL,

    [ValidateRange(1, 1000)]
    [int] $Repeat = 1,

    [string] $OutputFile,

    [ValidateRange(1, 600)]
    [int] $TimeoutSeconds = 300,

    [ValidateRange(1, 30)]
    [int] $PollIntervalSeconds = 2
)

Set-StrictMode -Version 3.0
$ErrorActionPreference = "Stop"

function Get-BaseUrlResolved {
    param([string] $B)
    if ([string]::IsNullOrWhiteSpace($B)) { return "http://127.0.0.1:5000" }
    return $B.TrimEnd("/")
}

function New-RequestHeaders {
    param([bool] $ForRealExecute)
    $h = @{}
    if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_API_KEY)) {
        $h["X-Api-Key"] = $env:ARCHLUCID_API_KEY
    }
    if ($ForRealExecute) {
        $h["X-ArchLucid-Pilot-Try-Real-Mode"] = "1"
    }
    return $h
}

function Invoke-ApiJsonPost {
    param(
        [string] $Uri,
        [object] $Body,
        [hashtable] $Headers
    )
    $p = @{
        Uri                = $Uri
        Method             = "Post"
        ContentType        = "application/json"
        SkipHttpErrorCheck = $true
    }
    if ($Headers.Count -gt 0) { $p.Headers = $Headers }
    if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 20 -Compress) }
    else { $p.Body = "{}" }
    return Invoke-WebRequest @p
}

function Get-ErrorText {
    param($Ex)
    if ($null -eq $Ex) { return "" }
    if ($Ex.ErrorDetails -and $Ex.ErrorDetails.Message) { return $Ex.ErrorDetails.Message }
    return $Ex.Exception.Message
}

$resolvedBase = Get-BaseUrlResolved -B $BaseUrl
$pilotHeaderForExecute = ($Mode -eq "Real")
$contosoDescription =
    "Contoso Retail: Modernize a small retail web application running on Azure. " +
    "The system needs scalable web tiers, a SQL backend, and basic compliance with PCI DSS. " +
    "Optimize for cost in a single region with private endpoints for storage and a managed identity for the application."

$runRows = [System.Collections.Generic.List[object]]::new()
$allTotals = [System.Collections.Generic.List[double]]::new()

for ($r = 0; $r -lt $Repeat; $r++) {
    $swAll = [System.Diagnostics.Stopwatch]::StartNew()
    $status = $null
    $headersNoPilot = New-RequestHeaders -ForRealExecute $false
    $requestId = [guid]::NewGuid().ToString("N")
    $createBody = @{
        requestId            = $requestId
        systemName           = "Contoso Retail"
        description          = $contosoDescription
        environment          = "prod"
        cloudProvider        = "Azure"
        constraints          = @("single-region", "low-cost")
        requiredCapabilities = @("web", "sql", "monitoring")
        assumptions          = @("No existing infrastructure to reuse")
    }
    $createUri = "$resolvedBase/v1/architecture/request"
    $swReq = [System.Diagnostics.Stopwatch]::StartNew()
    $resCreate = $null
    try {
        $resCreate = Invoke-ApiJsonPost -Uri $createUri -Body $createBody -Headers $headersNoPilot
    }
    catch {
        $msg = Get-ErrorText -Ex $_
        Write-Error "POST $createUri failed: $msg"
        exit 1
    }
    $swReq.Stop()
    if ($resCreate.StatusCode -ne 201 -and $resCreate.StatusCode -ne 200) {
        Write-Error "POST $createUri returned HTTP $($resCreate.StatusCode). Body: $($resCreate.Content)"
        exit 1
    }
    $createPayload = $resCreate.Content | ConvertFrom-Json
    $runId = $createPayload.run.runId
    if ([string]::IsNullOrWhiteSpace($runId)) {
        Write-Error "Create response did not include run.runId. Body: $($resCreate.Content)"
        exit 1
    }
    $requestMs = $swReq.Elapsed.TotalMilliseconds
    $swExec = [System.Diagnostics.Stopwatch]::StartNew()

    $execHeaders = New-RequestHeaders -ForRealExecute $pilotHeaderForExecute
    $executeUri = "$resolvedBase/v1/architecture/run/$([uri]::EscapeDataString($runId))/execute"
    try {
        $null = Invoke-ApiJsonPost -Uri $executeUri -Body $null -Headers $execHeaders
    }
    catch {
        # best-effort — same as try command when background loop will complete the run
    }

    $pollGetUri = "$resolvedBase/v1/architecture/run/$([uri]::EscapeDataString($runId))"
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $status = $null
    $pollError = $null
    while ((Get-Date) -lt $deadline) {
        $resGet = $null
        try {
            $g = @{
                Uri                = $pollGetUri
                Method             = "Get"
                Accept             = "application/json"
                SkipHttpErrorCheck = $true
            }
            if ($headersNoPilot.Count -gt 0) { $g.Headers = $headersNoPilot }
            $resGet = Invoke-WebRequest @g
        }
        catch {
            $pollError = Get-ErrorText -Ex $_
            break
        }
        if ($resGet.StatusCode -ne 200) {
            $pollError = "GET $pollGetUri returned HTTP $($resGet.StatusCode). Body: $($resGet.Content)"
            break
        }
        $detail = $resGet.Content | ConvertFrom-Json
        $status = [string] $detail.run.status
        if ($status -eq "Committed") {
            $pollError = "Run $runId is already Committed before POST /commit (unexpected). Stopping."
            break
        }
        if ($status -eq "ReadyForCommit") { break }
        if ($status -eq "Failed") {
            $pollError = "Run $runId entered Failed while polling. GET $pollGetUri"
            break
        }
        Start-Sleep -Seconds $PollIntervalSeconds
    }

    if ($null -ne $pollError) {
        $swAll.Stop()
        Write-Error $pollError
        exit 1
    }
    if ($null -eq $status -or $status -ne "ReadyForCommit") {
        $swAll.Stop()
        $last = if ($null -eq $status) { "(unknown)" } else { $status }
        Write-Error "Timed out after $TimeoutSeconds s (lastStatus=$last, runId=$runId). Increase -TimeoutSeconds or check API / agents."
        exit 1
    }
    $swExec.Stop()
    $executionMs = $swExec.Elapsed.TotalMilliseconds

    $swCommit = [System.Diagnostics.Stopwatch]::StartNew()
    $commitUri = "$resolvedBase/v1/architecture/run/$([uri]::EscapeDataString($runId))/commit"
    $resCommit = $null
    try {
        $resCommit = Invoke-ApiJsonPost -Uri $commitUri -Body $null -Headers $headersNoPilot
    }
    catch {
        $swAll.Stop()
        $msg = Get-ErrorText -Ex $_
        Write-Error "POST $commitUri failed: $msg"
        exit 1
    }
    $swCommit.Stop()
    if ($resCommit.StatusCode -ne 200) {
        $swAll.Stop()
        Write-Error "POST $commitUri returned HTTP $($resCommit.StatusCode). Body: $($resCommit.Content)"
        exit 1
    }
    $swAll.Stop()
    $totalMs = $swAll.Elapsed.TotalMilliseconds
    $allTotals.Add($totalMs)
    $runRows.Add([pscustomobject]@{
            mode         = $Mode
            totalMs      = [math]::Round($totalMs, 2)
            requestMs    = [math]::Round($requestMs, 2)
            executionMs  = [math]::Round($executionMs, 2)
            commitMs     = [math]::Round($swCommit.Elapsed.TotalMilliseconds, 2)
            runId        = $runId
            timestamp    = [DateTimeOffset]::UtcNow.ToString("o")
        })
}

$jsonOut = $null
if ($Repeat -le 1) {
    $jsonOut = $runRows[0] | ConvertTo-Json -Depth 10 -Compress
}
else {
    $stats = $null
    if ($allTotals.Count -gt 0) {
        $stats = [pscustomobject]@{
            min = [math]::Round(($allTotals | Measure-Object -Minimum).Minimum, 2)
            max = [math]::Round(($allTotals | Measure-Object -Maximum).Maximum, 2)
            avg = [math]::Round(($allTotals | Measure-Object -Average).Average, 2)
        }
    }
    $summary = [pscustomobject]@{
        baseUrl      = $resolvedBase
        mode         = $Mode
        repeatCount  = $Repeat
        totalMsStats = $stats
        runs         = @($runRows)
    }
    $jsonOut = $summary | ConvertTo-Json -Depth 20 -Compress
}

if ($OutputFile) {
    $dir = Split-Path -Parent $OutputFile
    if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $jsonOut | Set-Content -LiteralPath $OutputFile -Encoding utf8
}

$jsonOut
