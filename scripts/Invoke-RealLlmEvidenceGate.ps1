#!/usr/bin/env pwsh

<#

.SYNOPSIS

  Optional live Azure OpenAI gate: runs RealAzureOpenAIEndToEndTests when AOAI env vars are set; always writes Markdown evidence.



.PARAMETER MarkdownOut

  Destination for UTF-8 summary (default: artifacts/release/real-llm-evidence-gate.md).



.NOTES

  Live runs write separate metrics JSON files for topology-only and full-pipeline profiles.

  See docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md and docs/go-to-market/AI_EVIDENCE_APPENDIX.md.

#>

[CmdletBinding()]

param(

    [string] $MarkdownOut = "artifacts/release/real-llm-evidence-gate.md"

)



$ErrorActionPreference = "Continue"



$root = Split-Path -Parent $PSScriptRoot

Set-Location $root



. (Join-Path $PSScriptRoot 'Import-LocalRealAoaiEnv.ps1') -RepoRoot $root

. (Join-Path $PSScriptRoot 'RealLlmEvidenceGateDisposition.ps1')



$endpoint = $env:ARCHLUCID_REAL_AOAI_TEST_ENDPOINT

$key = $env:ARCHLUCID_REAL_AOAI_TEST_KEY



$topologyMetricsRelative = "artifacts/release/real-llm-topology-metrics.json"

$pipelineMetricsRelative = "artifacts/release/real-llm-full-pipeline-metrics.json"

$topologyMetricsAbs = Join-Path $root $topologyMetricsRelative

$pipelineMetricsAbs = Join-Path $root $pipelineMetricsRelative



function Add-EvidenceRow {

    param(

        [System.Collections.Generic.List[object]]$List,

        [string]$Name,

        [string]$Result,

        [string]$Detail

    )

    $List.Add([pscustomobject]@{ Check = $Name; Result = $Result; Detail = $Detail }) | Out-Null

}



function Read-MetricsJsonSafely {

    param([string]$Path)

    if (!(Test-Path -LiteralPath $Path)) {

        return $null

    }

    try {

        $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8

        return $raw | ConvertFrom-Json

    }

    catch {

        return $null

    }

}



function Add-ProfileEvidenceRows {

    param(

        [System.Collections.Generic.List[object]]$List,

        [string]$ProfileLabel,

        [object]$Metrics,

        [bool]$TestPassed

    )



    if (-not $TestPassed) {

        Add-EvidenceRow $List "$ProfileLabel run executed" "Failed" "dotnet test exit non-zero"

        return

    }



    Add-EvidenceRow $List "$ProfileLabel run executed" "Passed" "dotnet test exit 0"



    if ($null -eq $Metrics) {

        Add-EvidenceRow $List "$ProfileLabel metrics captured" "Failed" "metrics JSON missing after successful run"

        return

    }



    Add-EvidenceRow $List "$ProfileLabel metrics captured" "Passed" "profile=$($Metrics.liveEvidenceProfile) deployment=$($Metrics.deploymentName)"



    $pf = [int]$Metrics.parseFailures



    if ($pf -eq 0) {

        Add-EvidenceRow $List "$ProfileLabel parse failures" "Passed" "parseFailures=0 (attempts=$([int]$Metrics.parseAttempts))"

    }

    else {

        Add-EvidenceRow $List "$ProfileLabel parse failures" "Failed" "parseFailures=$pf"

    }



    if ([bool]$Metrics.evidenceRefsObserved) {

        Add-EvidenceRow $List "$ProfileLabel evidence refs" "Passed" "evidenceRefsObserved=true"

    }

    else {

        Add-EvidenceRow $List "$ProfileLabel evidence refs" "Failed" "evidenceRefsObserved=false"

    }



    $inTok = [int]$Metrics.inputTokensTotal

    $outTok = [int]$Metrics.outputTokensTotal



    if (($inTok + $outTok) -gt 0) {

        if ($null -ne $Metrics.estimatedCostUsd) {

            Add-EvidenceRow $List "$ProfileLabel token/cost" "Passed" "input=$inTok output=$outTok estimatedUsd=$($Metrics.estimatedCostUsd)"

        }

        else {

            Add-EvidenceRow $List "$ProfileLabel token/cost" "Passed" "input=$inTok output=$outTok (estimatedUsd not computed in gate; see host LlmCostEstimation)"

        }

    }

    else {

        Add-EvidenceRow $List "$ProfileLabel token/cost" "Not captured" "Provider returned zero token usage"

    }



    if ([string]$Metrics.liveEvidenceProfile -eq 'full-pipeline') {

        $mergeOk = [bool]$Metrics.mergeSuccess

        $svc = [int]$Metrics.manifestServiceCount

        $dec = [int]$Metrics.decisionsCount

        $claims = [int]$Metrics.totalClaims



        if ($mergeOk -and ($svc -gt 0) -and ($dec -gt 0) -and ($claims -gt 0)) {

            Add-EvidenceRow $List "$ProfileLabel merge completeness" "Passed" "services=$svc decisions=$dec claims=$claims"

        }

        else {

            Add-EvidenceRow $List "$ProfileLabel merge completeness" "Failed" "mergeSuccess=$mergeOk services=$svc decisions=$dec claims=$claims"

        }

    }

    else {

        $claims = [int]$Metrics.totalClaims
        $findings = if ($null -ne $Metrics.totalFindings) { [int]$Metrics.totalFindings } else { 0 }
        $topologyItems = if ($null -ne $Metrics.topologyProposalItemCount) { [int]$Metrics.topologyProposalItemCount } else { 0 }
        $substanceCount = $claims + $findings + $topologyItems

        if ($substanceCount -gt 0) {

            Add-EvidenceRow $List "$ProfileLabel structural smoke" "Passed" "topology-only: substance=$substanceCount claims=$claims findings=$findings topologyItems=$topologyItems"

        }

        else {

            Add-EvidenceRow $List "$ProfileLabel structural smoke" "Failed" "topology-only: substance=$substanceCount"

        }

    }



    if ([bool]$Metrics.durableSqlPersistenceExercised) {

        Add-EvidenceRow $List "$ProfileLabel trace persistence" "Passed" "dbo.AgentExecutionTraces path exercised"

    }

    else {

        Add-EvidenceRow $List "$ProfileLabel trace persistence" "Not captured" "Gate uses in-memory trace recorder only"

    }

}



$credsPresent = (-not [string]::IsNullOrWhiteSpace($endpoint)) -and (-not [string]::IsNullOrWhiteSpace($key))



$rows = [System.Collections.Generic.List[object]]::new()

$topologyMetrics = $null

$pipelineMetrics = $null

$exitCode = 0



if ($credsPresent) {

    foreach ($path in @($topologyMetricsAbs, $pipelineMetricsAbs)) {

        if (Test-Path -LiteralPath $path) {

            Remove-Item -LiteralPath $path -Force

        }

    }



    Write-Host "Running RealAzureOpenAIEndToEndTests (topology smoke)..." -ForegroundColor Cyan

    $env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON = $topologyMetricsAbs

    dotnet test .\ArchLucid.AgentRuntime.Tests\ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~Live_topology_agent_only_produces_valid_agent_result"

    $topologyExit = $LASTEXITCODE



    Write-Host "Running RealAzureOpenAIEndToEndTests (full multi-agent pipeline)..." -ForegroundColor Cyan

    $env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON = $pipelineMetricsAbs

    dotnet test .\ArchLucid.AgentRuntime.Tests\ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~Live_pipeline_topology_compliance_cost_merge_produces_non_empty_manifest"

    $pipelineExit = $LASTEXITCODE



    Remove-Item Env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON -ErrorAction SilentlyContinue



    $exitCode = if (($topologyExit -ne 0) -or ($pipelineExit -ne 0)) { 1 } else { 0 }

    $topologyMetrics = Read-MetricsJsonSafely -Path $topologyMetricsAbs

    $pipelineMetrics = Read-MetricsJsonSafely -Path $pipelineMetricsAbs



    Add-EvidenceRow $rows "Credentials present" "Passed" "ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY are set (values not logged)"

    Add-ProfileEvidenceRows -List $rows -ProfileLabel "Topology smoke" -Metrics $topologyMetrics -TestPassed:($topologyExit -eq 0)

    Add-ProfileEvidenceRows -List $rows -ProfileLabel "Full pipeline" -Metrics $pipelineMetrics -TestPassed:($pipelineExit -eq 0)



    Add-EvidenceRow $rows "Semantic score" "Not captured" "Reference evaluation / golden cohort scoring not wired for this gate"

}

else {

    Remove-Item Env:ARCHLUCID_REAL_LLM_RUN_METRICS_JSON -ErrorAction SilentlyContinue



    foreach ($path in @($topologyMetricsAbs, $pipelineMetricsAbs)) {

        if (Test-Path -LiteralPath $path) {

            Remove-Item -LiteralPath $path -Force

        }

    }



    Add-EvidenceRow $rows "Credentials present" "Skipped" "ARCHLUCID_REAL_AOAI_TEST_ENDPOINT / ARCHLUCID_REAL_AOAI_TEST_KEY not set"

    Add-EvidenceRow $rows "Topology smoke run executed" "Skipped" "Requires live credentials"

    Add-EvidenceRow $rows "Full pipeline run executed" "Skipped" "Requires live credentials"

    Add-EvidenceRow $rows "Semantic score" "Skipped" "Requires live credentials"



    $exitCode = 0

}



$overallDisposition = Get-RealLlmEvidenceGateDisposition `
    -CredentialsPresent $credsPresent `
    -DotnetExitCode $exitCode `
    -EvidenceRows @($rows) `
    -TopologyMetrics $topologyMetrics `
    -PipelineMetrics $pipelineMetrics



$generatedUtc = [DateTime]::UtcNow.ToString('o')

$topologyRel = $topologyMetricsRelative.Replace("\", "/")

$pipelineRel = $pipelineMetricsRelative.Replace("\", "/")



$md = "# Real LLM evidence gate (generated)`n`n"

$md += "Generated (UTC): **$generatedUtc**`n`n"

$md += "**Overall disposition:** ``$overallDisposition```n`n"

$md += "Template: [docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](../docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)`n`n"

$md += "Buyer index: [docs/go-to-market/AI_EVIDENCE_APPENDIX.md](../docs/go-to-market/AI_EVIDENCE_APPENDIX.md)`n`n"



if ($credsPresent) {

    $md += "| Profile metrics JSON | Path |`n| --- | --- |`n"

    $md += "| Topology smoke | ``$topologyRel`` |`n"

    $md += "| Full pipeline | ``$pipelineRel`` |`n`n"

}



$md += '| Check | Result | Detail |' + [Environment]::NewLine

$md += '| --- | --- | --- |' + [Environment]::NewLine



foreach ($r in $rows) {

    $md += ('| {0} | **{1}** | {2} |' -f $r.Check, $r.Result, $r.Detail) + [Environment]::NewLine

}



$md += @'



## Legend



- **Passed** — positive signal for the row.

- **Failed** — failing assertion, merge/schema failure, or non-zero test exit when a live run was attempted.

- **Skipped** — prerequisite missing (typically credentials); not an execution failure.

- **Not captured** — no data for this dimension on this machine, or durable/host-only evidence.



## What each profile proves



- **Topology smoke** — Azure OpenAI completion path, JSON parsing, and evidence-reference emission for one Topology agent. Does **not** prove full multi-agent merge or sponsor-safe manifest completeness.

- **Full pipeline** — Topology + Compliance + Cost + Critic execution with decision merge, manifest service count, and decision count. Required before claiming full real-LLM validation.



`SKIPPED_NO_CREDENTIALS` is **not** a pass. Do not cite this gate as live validation unless disposition is `PASS` with both profiles captured.

'@



$outAbs =

    if ([System.IO.Path]::IsPathRooted($MarkdownOut)) {

        $MarkdownOut

    }

    else {

        Join-Path $root $MarkdownOut

    }



$dir = Split-Path -Parent $outAbs



if (!(Test-Path -LiteralPath $dir)) {

    New-Item -ItemType Directory -Path $dir | Out-Null

}



[System.IO.File]::WriteAllText($outAbs, $md, [System.Text.UTF8Encoding]::new($false))

Write-Host "Wrote $outAbs" -ForegroundColor Green



$jsonOutAbs =

    if ($MarkdownOut -match '\.md$') {

        [System.IO.Path]::ChangeExtension($outAbs, '.json')

    }

    else {

        Join-Path $dir 'real-llm-evidence-gate.json'

    }



$topologyMetricsPathForJson = if ($credsPresent -and (Test-Path -LiteralPath $topologyMetricsAbs)) { $topologyRel } else { $null }

$pipelineMetricsPathForJson = if ($credsPresent -and (Test-Path -LiteralPath $pipelineMetricsAbs)) { $pipelineRel } else { $null }



$jsonPayload = New-RealLlmEvidenceGateJsonPayload `

    -GeneratedUtc $generatedUtc `

    -Disposition $overallDisposition `

    -CredentialsPresent $credsPresent `

    -DotnetExitCode $exitCode `

    -Checks @($rows) `

    -TopologyMetricsRelativePath $topologyMetricsPathForJson `

    -PipelineMetricsRelativePath $pipelineMetricsPathForJson `

    -TopologyMetrics $topologyMetrics `

    -PipelineMetrics $pipelineMetrics



$jsonPayload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonOutAbs -Encoding UTF8

Write-Host "Wrote $jsonOutAbs" -ForegroundColor Green



if (Test-RealLlmEvidenceGateShouldExitNonZero -Disposition $overallDisposition) {

    Write-Host "Real-LLM evidence gate disposition: $overallDisposition" -ForegroundColor Red

    exit 1

}



exit 0


