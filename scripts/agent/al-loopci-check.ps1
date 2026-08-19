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

$raw = gh run list --workflow ci.yml --branch $Branch --limit 1 --json databaseId,status,conclusion,headSha,url,createdAt,updatedAt
if ($LASTEXITCODE -ne 0) {
    throw "gh run list failed for branch '$Branch' (exit $LASTEXITCODE)."
}

$run = $raw | ConvertFrom-Json | Select-Object -First 1
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

$json = $payload | ConvertTo-Json -Compress
$line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $json
Add-Content -LiteralPath $logPath -Value $line
Write-Output $json
