#Requires -Version 5.1
# Register or remove a Windows Scheduled Task that runs agent worktree cleanup daily.

[CmdletBinding()]
param(
    [string] $RepoRoot,
    [string] $At = '03:00',
    [switch] $Unregister
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$helpersPath = Join-Path $PSScriptRoot 'cleanup-agent-worktrees.helpers.ps1'
. $helpersPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Resolve-GitRepositoryRootFromScript -StartingDirectory $PSScriptRoot
}

$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$primaryCheckout = 'C:\archlucid\archlucid'
if (Test-Path -LiteralPath $primaryCheckout) {
    $RepoRoot = (Resolve-Path -LiteralPath $primaryCheckout).Path
}

$taskName = 'ArchLucid-AgentWorktreeCleanup'
$cleanupScript = Join-Path $PSScriptRoot 'cleanup-agent-worktrees.ps1'

if ($Unregister) {
    $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        Write-Host "Scheduled task '$taskName' is not registered." -ForegroundColor Yellow
        exit 0
    }

    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Unregistered scheduled task '$taskName'." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path -LiteralPath $cleanupScript)) {
    throw "Cleanup script not found: $cleanupScript"
}

$powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$cleanupScript`" -Force -IncludeTempClones -RepoRoot `"$RepoRoot`""
$action = New-ScheduledTaskAction -Execute $powershell -Argument $arguments -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($null -ne $existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Removes ephemeral Cursor/agent git worktrees and stale ArchLucid temp clones to prevent ENOSPC on dev workstations.' | Out-Null

Write-Host "Registered daily scheduled task '$taskName' at $At targeting primary repo $RepoRoot" -ForegroundColor Green
