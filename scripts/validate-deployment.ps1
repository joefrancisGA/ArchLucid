#!/usr/bin/env pwsh
# Read-only HTTP smoke. Requires PowerShell 7+.
#   pwsh ./scripts/validate-deployment.ps1 -BaseUrl http://localhost:5128
# Optional: -ApiKey for authenticated routes; -Json for machine output; -Verbose for per-check text.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BaseUrl,
    [string] $ApiKey = "",
    [switch] $Verbose,
    [switch] $Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$allPassed = $true
$script:rows = [System.Collections.Generic.List[object]]::new()

function Add-Row([string] $n, [string] $s, [int] $ms, [string] $d = "") {
    $script:rows.Add([pscustomobject]@{ name = $n; status = $s; ms = $ms; detail = $d })
    if ($s -eq "FAIL") { $script:allPassed = $false }
    if ($Verbose -or -not $Json) { Write-Host ("{0,-6} {1,4}ms  {2}  {3}" -f $s, $ms, $n, $d) }
}

function Get-Text([string] $uri) {
    $h = @{}
    if ($ApiKey) { $h["X-API-Key"] = $ApiKey }
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $r = Invoke-WebRequest -Uri $uri -Headers $h -SkipHttpErrorCheck -TimeoutSec 60
        $sw.Stop()
        return @{ Ok = $true; Code = [int]$r.StatusCode; Ms = [int]$sw.ElapsedMilliseconds; Response = $r }
    }
    catch {
        $sw.Stop()
        return @{ Ok = $false; Code = 0; Ms = [int]$sw.ElapsedMilliseconds; Error = $_.Exception.Message }
    }
}

$Base = $BaseUrl.TrimEnd('/')

$u = $null
try { $u = [Uri]$Base } catch { throw "Invalid -BaseUrl" }

foreach ($pair in @(
        @{ n = "GET /health/live"; p = "/health/live"; ok = @(200) },
        @{ n = "GET /health/ready"; p = "/health/ready"; ok = @(200) },
        @{ n = "GET /version"; p = "/version"; ok = @(200) },
        @{ n = "GET /openapi/v1.json"; p = "/openapi/v1.json"; ok = @(200) }
    )) {
    $g = Get-Text ("$Base" + $pair.p)
    if ($g.Ok -and $pair.ok -contains $g.Code) { Add-Row $pair.n "PASS" $g.Ms "HTTP $($g.Code)" }
    elseif ($g.Ok) { Add-Row $pair.n "FAIL" $g.Ms "HTTP $($g.Code)" }
    else { Add-Row $pair.n "FAIL" $g.Ms $g.Error }
}

$gh = Get-Text ("$Base/health")
if ($gh.Ok -and $gh.Code -eq 200) { Add-Row "GET /health" "PASS" $gh.Ms "HTTP 200" }
elseif ($gh.Ok) { Add-Row "GET /health" "FAIL" $gh.Ms "HTTP $($gh.Code) (read authority?)" }
else { Add-Row "GET /health" "FAIL" $gh.Ms $gh.Error }

$gr = Get-Text ("$Base/v1/architecture/runs")
if ($gr.Ok -and @(200, 401, 403) -contains $gr.Code) { Add-Row "GET /v1/architecture/runs" "PASS" $gr.Ms "HTTP $($gr.Code)" }
elseif ($gr.Ok) { Add-Row "GET /v1/architecture/runs" "FAIL" $gr.Ms "HTTP $($gr.Code)" }
else { Add-Row "GET /v1/architecture/runs" "FAIL" $gr.Ms $gr.Error }

$gc = Get-Text ("$Base/health/live")
if ($gc.Ok -and $null -ne $gc.Response.Headers["X-Correlation-ID"]) {
    Add-Row "X-Correlation-ID" "PASS" $gc.Ms "present"
}
elseif ($gc.Ok) {
    Add-Row "X-Correlation-ID" "FAIL" $gc.Ms "missing"
}
else { Add-Row "X-Correlation-ID" "FAIL" $gc.Ms $gc.Error }

$go = Invoke-WebRequest -Uri ("$Base/health/live") -Headers @{ Origin = "https://example.test" } -SkipHttpErrorCheck -TimeoutSec 60
$msO = 0
if ($go.Headers["Access-Control-Allow-Origin"]) {
    Add-Row "CORS (Origin header)" "PASS" 0 "ACAO set"
}
else {
    Add-Row "CORS (Origin header)" "SKIP" 0 "no ACAO (may be normal for this host)"
}

$rl = $false
foreach ($k in $go.Headers.Keys) { if ("$k" -like "X-RateLimit*") { $rl = $true; break } }
if ($rl) { Add-Row "X-RateLimit-*" "PASS" 0 "present" } else { Add-Row "X-RateLimit-*" "SKIP" 0 "not on health/live" }

if ($u.Scheme -eq "http") {
    $rd = Invoke-WebRequest -Uri ("$Base/health/live") -MaximumRedirection 0 -SkipHttpErrorCheck -ErrorAction SilentlyContinue
    if ($null -ne $rd -and @(301, 302, 307, 308) -contains [int]$rd.StatusCode) {
        Add-Row "HTTP→HTTPS" "PASS" 0 "redirect $([int]$rd.StatusCode)"
    }
    else { Add-Row "HTTP→HTTPS" "SKIP" 0 "no forced redirect" }
}
else { Add-Row "HTTP→HTTPS" "SKIP" 0 "not an http base URL" }

if ($Json) { $script:rows | ConvertTo-Json -Depth 4 -Compress }

if (-not $allPassed) { exit 1 }
exit 0
