#Requires -Version 5.1
<#
.SYNOPSIS
  Returns JSON for the latest ci.yml run on a branch (for /al-loopci polling).

.NOTES
  needsTriage is true when the run completed with any conclusion other than success
  (failure, timed_out, cancelled, etc.). Agents must enter fix/redispatch triage then.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Branch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$logDir = Join-Path $repoRoot '.local'
$logPath = Join-Path $logDir ("ci-watch-{0}.log" -f $Branch)

if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Get-GitHubOwnerRepoFromOrigin {
    $remote = git -C $repoRoot config --get remote.origin.url 2>$null
    if ([string]::IsNullOrWhiteSpace($remote)) {
        return $null
    }

    if ($remote -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)(?:\.git)?$') {
        return @{
            Owner = $Matches.owner
            Repo  = $Matches.repo
        }
    }

    return $null
}

function Get-LatestCiYmlRunViaPublicApi {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Owner,
        [Parameter(Mandatory = $true)]
        [string]$Repo,
        [Parameter(Mandatory = $true)]
        [string]$BranchName
    )

    $encodedBranch = [uri]::EscapeDataString($BranchName)
    $apiUrl = "https://api.github.com/repos/$Owner/$Repo/actions/workflows/ci.yml/runs?branch=$encodedBranch&per_page=1"
    $curlArgs = @('-fsSL', '-H', 'Accept: application/vnd.github+json', $apiUrl)
    $response = & curl @curlArgs 2>$null

    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($response)) {
        return $null
    }

    $parsed = $response | ConvertFrom-Json
    $workflowRun = $parsed.workflow_runs | Select-Object -First 1

    if ($null -eq $workflowRun) {
        return $null
    }

    return [pscustomobject]@{
        databaseId = [string]$workflowRun.id
        status     = [string]$workflowRun.status
        conclusion = [string]$workflowRun.conclusion
        headSha    = [string]$workflowRun.head_sha
        url        = [string]$workflowRun.html_url
        createdAt  = [string]$workflowRun.created_at
        updatedAt  = [string]$workflowRun.updated_at
        source     = 'public-api-fallback'
    }
}

$run = $null
$ghErr = $null
try {
    $raw = gh run list --workflow ci.yml --branch $Branch --limit 1 --json databaseId,status,conclusion,headSha,url,createdAt,updatedAt 2>&1
    if ($LASTEXITCODE -ne 0) {
        $ghErr = [string]$raw
        throw "gh exit $LASTEXITCODE"
    }

    $run = $raw | ConvertFrom-Json | Select-Object -First 1
}
catch {
    $origin = Get-GitHubOwnerRepoFromOrigin
    if ($null -eq $origin) {
        throw "gh run list failed for branch '$Branch' and could not parse remote.origin.url for public API fallback. $ghErr"
    }

    $run = Get-LatestCiYmlRunViaPublicApi -Owner $origin.Owner -Repo $origin.Repo -BranchName $Branch
    if ($null -eq $run) {
        throw "gh run list failed for branch '$Branch' and public API fallback returned no ci.yml runs. $ghErr"
    }
}

if ($null -eq $run) {
    $payload = [ordered]@{
        branch      = $Branch
        found       = $false
        needsTriage = $false
        checkedAt   = (Get-Date).ToString('o')
    }
    $json = $payload | ConvertTo-Json -Compress
    Add-Content -LiteralPath $logPath -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $json)
    Write-Output $json
    exit 0
}

$status = [string]$run.status
$conclusion = [string]$run.conclusion
# Any completed run that is not green is actionable (failure, timed_out, canceled, …).
$needsTriage = ($status -eq 'completed') -and ($conclusion -ne 'success')

$payload = [ordered]@{
    branch      = $Branch
    found       = $true
    databaseId  = [string]$run.databaseId
    status      = $status
    conclusion  = $conclusion
    needsTriage = $needsTriage
    headSha     = [string]$run.headSha
    url         = [string]$run.url
    createdAt   = [string]$run.createdAt
    updatedAt   = [string]$run.updatedAt
    checkedAt   = (Get-Date).ToString('o')
}

if ($null -ne $run.PSObject.Properties['source']) {
    $payload.source = [string]$run.source
}

$json = $payload | ConvertTo-Json -Compress
$line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $json
Add-Content -LiteralPath $logPath -Value $line
Write-Output $json
