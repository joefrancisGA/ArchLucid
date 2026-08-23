#Requires -Version 5.1
<#
.SYNOPSIS
    Start a Cursor Cloud Agent via the v1 API (Composer 2.5 standard, not Fast).

.PARAMETER Text
    Task prompt text for the cloud agent.

.PARAMETER ImagePath
    Optional screenshot/image path (png, jpeg, gif, webp).

.PARAMETER ConfigPath
    Optional path to al-api.config.json. Defaults to .cursor/al-api.config.json in repo root.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Text,

    [Parameter(Mandatory = $false)]
    [string]$ImagePath,

    [Parameter(Mandatory = $false)]
    [string]$ConfigPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    $currentPath = (Get-Location).Path

    if (Test-Path (Join-Path $currentPath ".git")) {
        return $currentPath
    }

    $scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
    $candidate = Resolve-Path (Join-Path $scriptDirectory "..")
    return $candidate.Path
}

function Read-Config {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Config not found at '$Path'. Copy .cursor/al-api.config.example.json to .cursor/al-api.config.json and set your API key."
    }

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8
    return $raw | ConvertFrom-Json
}

function Get-ApiKey {
    param(
        $Config
    )

    if ($env:CURSOR_API_KEY -and $env:CURSOR_API_KEY.Trim().Length -gt 0) {
        return $env:CURSOR_API_KEY.Trim()
    }

    if ($Config.apiKey -and $Config.apiKey.ToString().Trim().Length -gt 0) {
        return $Config.apiKey.ToString().Trim()
    }

    throw "Missing API key. Set CURSOR_API_KEY or apiKey in .cursor/al-api.config.json."
}

function Get-OriginRepoUrl {
  param(
    [string]$RepoRoot
  )

  Push-Location $RepoRoot
  try {
    $remoteUrl = (git remote get-url origin 2>$null)
    if (-not $remoteUrl) {
      return $null
    }

    # Normalize git@github.com:org/repo.git and https forms to https://github.com/org/repo
    if ($remoteUrl -match '^git@([^:]+):(.+?)(?:\.git)?$') {
      return "https://$($Matches[1])/$($Matches[2])"
    }

    if ($remoteUrl -match '^https?://') {
      return ($remoteUrl -replace '\.git$', '')
    }

    return $remoteUrl
  }
  finally {
    Pop-Location
  }
}

function Get-MimeType {
    param(
        [string]$Path
    )

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".webp" { return "image/webp" }
        default { throw "Unsupported image type '$Path'. Use png, jpg, jpeg, gif, or webp." }
    }
}

function New-ImagePayload {
    param(
        [string]$Path
    )

    if (-not $Path -or $Path.Trim().Length -eq 0) {
        return $null
    }

    $resolved = Resolve-Path $Path
    $fileInfo = Get-Item $resolved
    $maxBytes = 15MB

    if ($fileInfo.Length -gt $maxBytes) {
        throw "Image exceeds 15 MB limit: $Path"
    }

    $bytes = [System.IO.File]::ReadAllBytes($fileInfo.FullName)
    $base64 = [Convert]::ToBase64String($bytes)

    return @{
        data = $base64
        mimeType = (Get-MimeType -Path $fileInfo.FullName)
    }
}

function New-AuthHeader {
    param(
        [string]$ApiKey
    )

    $token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ApiKey}:"))
    return @{ Authorization = "Basic $token" }
}

$repoRoot = Get-RepoRoot

if (-not $ConfigPath) {
    $ConfigPath = Join-Path $repoRoot ".cursor/al-api.config.json"
}

$config = Read-Config -Path $ConfigPath
$apiKey = Get-ApiKey -Config $config

$repoUrl = $config.repoUrl
if (-not $repoUrl -or $repoUrl.ToString().Trim().Length -eq 0) {
    $repoUrl = Get-OriginRepoUrl -RepoRoot $repoRoot
}

if (-not $repoUrl) {
    throw "repoUrl is not set in config and could not be detected from git origin."
}

$startingRef = if ($config.startingRef) { $config.startingRef } else { "main" }
$autoCreatePr = if ($null -ne $config.autoCreatePR) { [bool]$config.autoCreatePR } else { $false }

# Locked: /al-api always uses Composer 2.5 standard (non-Fast) for lower cost.
$modelId = "composer-2.5"
$useFast = $false

$prompt = @{
    text = $Text
}

$imagePayload = New-ImagePayload -Path $ImagePath
if ($imagePayload) {
    $prompt.images = @($imagePayload)
}

$body = @{
    prompt = $prompt
    model = @{
        id = $modelId
        params = @(
            @{
                id = "fast"
                value = if ($useFast) { "true" } else { "false" }
            }
        )
    }
    repos = @(
        @{
            url = $repoUrl.ToString().Trim()
            startingRef = $startingRef
        }
    )
    autoCreatePR = $autoCreatePr
}

$json = $body | ConvertTo-Json -Depth 8 -Compress:$false
$headers = New-AuthHeader -ApiKey $apiKey

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.cursor.com/v1/agents" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body $json
}
catch {
    $errorBody = $_.ErrorDetails.Message
    if ($errorBody) {
        throw "Cloud Agent API error: $errorBody"
    }

    throw
}

$agentUrl = $response.agent.url
$agentId = $response.agent.id
$runId = $response.run.id

Write-Output ""
Write-Output "Cloud agent started"
Write-Output "  Agent: $agentId"
Write-Output "  Run:   $runId"
Write-Output "  URL:   $agentUrl"
Write-Output "  Model: $modelId (fast=$useFast)"
Write-Output ""

# Return structured object for scripting
return [PSCustomObject]@{
    AgentId = $agentId
    RunId = $runId
    Url = $agentUrl
    Model = $modelId
    Fast = $useFast
}
