#Requires -Version 5.1
# preToolUse: block Write/StrReplace on paths dirty at session start.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

if ($env:ARCHLUCID_AGENT_ALLOW_DIRTY -eq '1') {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

$payload = $inputJson | ConvertFrom-Json
$toolName = [string]$payload.tool_name
if ($toolName -notin @('Write', 'StrReplace', 'apply_patch')) {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

$toolInput = $payload.tool_input
$targetPath = $null
if ($null -ne $toolInput.path) {
    $targetPath = [string]$toolInput.path
}
elseif ($null -ne $toolInput.target_file) {
    $targetPath = [string]$toolInput.target_file
}

if ([string]::IsNullOrWhiteSpace($targetPath)) {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

$checkScript = Join-Path $repoRoot 'scripts\agent\check-working-tree-path.ps1'
if (-not (Test-Path -LiteralPath $checkScript)) {
    Write-Output '{ "permission": "allow" }'
    exit 0
}

& powershell -NoProfile -ExecutionPolicy Bypass -File $checkScript -Path $targetPath
if ($LASTEXITCODE -eq 2) {
    $escapedPath = $targetPath.Replace('\', '\\').Replace('"', '\"')
    Write-Output (@"
{
  "permission": "deny",
  "user_message": "Blocked edit to '$targetPath': file had unstaged changes when this agent session started. Stash/commit your changes, or set ARCHLUCID_AGENT_ALLOW_DIRTY=1 to override.",
  "agent_message": "Do not overwrite user unstaged edits on '$targetPath'. Run git status, ask the user, or edit a different path."
}
"@)
    exit 0
}

Write-Output '{ "permission": "allow" }'
exit 0
