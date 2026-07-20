#Requires -Version 5.1
<#
.SYNOPSIS
  Returns JSON for the latest ci.yml run on a branch (for /al-loopci polling).
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
        branch     = $Branch
        found      = $false
        checkedAt  = (Get-Date).ToString('o')
    }
    $json = $payload | ConvertTo-Json -Compress
    Add-Content -LiteralPath $logPath -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $json)
    Write-Output $json
    exit 0
}

$payload = [ordered]@{
    branch     = $Branch
    found      = $true
    databaseId = [string]$run.databaseId
    status     = [string]$run.status
    conclusion = [string]$run.conclusion
    headSha    = [string]$run.headSha
    url        = [string]$run.url
    createdAt  = [string]$run.createdAt
    updatedAt  = [string]$run.updatedAt
    checkedAt  = (Get-Date).ToString('o')
}

$json = $payload | ConvertTo-Json -Compress
$line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $json
Add-Content -LiteralPath $logPath -Value $line
Write-Output $json
