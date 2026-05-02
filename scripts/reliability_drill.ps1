# Reliability drill (non-destructive): health snapshots + deterministic JSON/Markdown evidence.
#
# Usage (repo root):
#   pwsh scripts/reliability_drill.ps1 -BaseUrl https://localhost:7145
#   pwsh scripts/reliability_drill.ps1 -SkipProbe  # schedules / CI scaffolding without probing a live URL
#
# Outputs:
#   dist/reliability-drill/evidence-summary.json
#   dist/reliability-drill/evidence-summary.md

param(
    [Parameter(Mandatory = $false)]
    [string] $BaseUrl = "http://localhost:5000",
    [int] $TimeoutSeconds = 20,
    [switch] $SkipProbe
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$outputDir = Join-Path $root 'dist/reliability-drill'

if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$base = ($BaseUrl.Trim().TrimEnd('/'))
$checks = New-Object System.Collections.Generic.List[object]
$overallPass = $true

function Probe-Ready {
    param([string] $ProbeBase)
    try {
        $resp = Invoke-WebRequest -Uri "$ProbeBase/health/ready" -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $bodyLen = 0

        if ($resp.Content.Length -gt 0) {
            $bodyLen = $resp.Content.Length
        }

        return @{
            name    = '/health/ready'
            uri     = "$ProbeBase/health/ready"
            status  = [int]$resp.StatusCode
            healthy = ([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 400)
            bodyLen = $bodyLen
            error   = $null
        }
    }
    catch {
        return @{
            name    = '/health/ready'
            uri     = "$ProbeBase/health/ready"
            status  = -1
            healthy = $false
            bodyLen = 0
            error   = $_.Exception.Message
        }
    }
}


if ($SkipProbe) {


    [void]$checks.Add(
        @{


            name    = '/health/ready'


            uri     = "$base/health/ready"


            status  = -1


            healthy = $true


            bodyLen = 0


            error   = '(SkipProbe — no outbound HTTP)'


        })


    $overallPass = $true

}

else {


    $r = Probe-Ready -ProbeBase $base

    if (-not $r.healthy) {


        $overallPass = $false


    }



    [void]$checks.Add($r)


}




$stamp = Get-Date -Format 'o'

$payload = @{
    schemaVersion             = '1.0'
    generatedAtUtc            = $stamp
    targetBaseUrl             = $base
    overallPass               = $overallPass
    probeSkipped              = [bool]$SkipProbe
    observedDependencyFailure = @{
        simulated = $SkipProbe.IsPresent
        note      =
        'Probe path uses /health/ready only; injecting chaos / dependency faults belongs in staffed game-days with infra approval.'
    }
    outboxRecovery            = @{
        simulated           = $false
        expectedMetricHints = @(
            'Integration outbox gauges (infra workbook)'
            'Health/ready decomposition for SQL + blob tiers'
        )
        note =
        'When backlog persists, converge workers vs producer rate before widening customer-facing SLO thresholds.'
    }
    checks                    = $checks.ToArray()
}

$jsonPath = Join-Path $outputDir 'evidence-summary.json'
$mdPath = Join-Path $outputDir 'evidence-summary.md'

$payload | ConvertTo-Json -Depth 9 | Set-Content -Encoding utf8 $jsonPath

$tableLines = New-Object System.Collections.Generic.List[string]

foreach ($c in $checks.ToArray()) {
    $detail = if ([string]::IsNullOrEmpty([string]$c.error)) {


        "length $([string]$c.bodyLen) chars"


    }

    else {


        [string]$c.error


    }


    [void]$tableLines.Add("| $($c.name) | $($c.healthy) | $($c.status) | $detail |")


}

$tableMd = ($tableLines -join "`n")

@"
# Reliability drill evidence

_Generated_: **$stamp** · **Target**: ``$base`` · **Pass**: **$overallPass** · **SkipProbe**: **$SkipProbe**

## Checks

| Name | Healthy | HTTP | Detail |
|---|---|---|---|
$tableMd

_See also_: ``docs/runbooks/RELIABILITY_DRILL_PACKAGE.md``

"@ | Set-Content -Encoding utf8 $mdPath

Write-Host "Reliability drill complete. JSON: $jsonPath Markdown: $mdPath Pass=$overallPass"



if (-not $overallPass) {


    exit 2


}




exit 0
