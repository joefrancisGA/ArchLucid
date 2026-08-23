#Requires -Version 5.1
<#
.SYNOPSIS
    Poll a Cursor Cloud Agent run until it reaches a terminal status.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $AgentId,

    [Parameter(Mandatory = $true)]
    [string] $RunId,

    [int] $PollIntervalSeconds = 30,

    [string] $ConfigPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    $currentPath = (Get-Location).Path

    if (Test-Path (Join-Path $currentPath '.git')) {
        return $currentPath
    }

    $scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
    return (Resolve-Path (Join-Path $scriptDirectory '..')).Path
}

function Read-Config {
    param([string] $Path)

    if (-not (Test-Path $Path)) {
        throw "Config not found at '$Path'. Copy .cursor/al-api.config.example.json to .cursor/al-api.config.json."
    }

    return (Get-Content -Path $Path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Get-ApiKey {
    param($Config)

    if ($env:CURSOR_API_KEY -and $env:CURSOR_API_KEY.Trim().Length -gt 0) {
        return $env:CURSOR_API_KEY.Trim()
    }

    if ($Config.apiKey -and $Config.apiKey.ToString().Trim().Length -gt 0) {
        return $Config.apiKey.ToString().Trim()
    }

    throw 'Missing API key. Set CURSOR_API_KEY or apiKey in .cursor/al-api.config.json.'
}

function New-AuthHeader {
    param([string] $ApiKey)

    $token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ApiKey}:"))
    return @{ Authorization = "Basic $token" }
}

$terminalStatuses = @('FINISHED', 'ERROR', 'CANCELLED', 'EXPIRED')
$repoRoot = Get-RepoRoot

if (-not $ConfigPath) {
    $ConfigPath = Join-Path $repoRoot '.cursor/al-api.config.json'
}

$config = Read-Config -Path $ConfigPath
$apiKey = Get-ApiKey -Config $config
$headers = New-AuthHeader -ApiKey $apiKey
$uri = "https://api.cursor.com/v1/agents/$AgentId/runs/$RunId"
$run = $null

while ($true) {
    try {
        $run = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    }
    catch {
        $errorBody = $_.ErrorDetails.Message
        if ($errorBody) {
            throw "Cloud Agent API error: $errorBody"
        }

        throw
    }

    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host ("[{0}] run {1} status={2}" -f $timestamp, $RunId, $run.status)

    if ($terminalStatuses -contains $run.status) {
        break
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}

Write-Host ''
Write-Host 'Run finished'
Write-Host "  Status:    $($run.status)"

if ($null -ne $run.durationMs) {
    Write-Host "  Duration:  $($run.durationMs) ms"
}

if ($run.result) {
    $preview = $run.result
    if ($preview.Length -gt 240) {
        $preview = $preview.Substring(0, 240) + '...'
    }

    Write-Host "  Result:    $preview"
}

Write-Host ''

return [PSCustomObject]@{
    AgentId = $AgentId
    RunId = $RunId
    Status = $run.status
    DurationMs = $run.durationMs
    Result = $run.result
    Run = $run
}
