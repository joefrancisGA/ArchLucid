#Requires -Version 5.1
# Remove ephemeral agent git worktrees and stale ArchLucid temp clones.
#
# Usage:
#   .\scripts\cleanup-agent-worktrees.ps1 -DryRun
#   .\scripts\cleanup-agent-worktrees.ps1 -Force
#   .\scripts\cleanup-agent-worktrees.ps1 -Force -IncludeTempClones
#
# Recurring (Windows Task Scheduler):
#   .\scripts\Register-ArchLucidAgentWorktreeCleanupTask.ps1

[CmdletBinding()]
param(
    [string] $RepoRoot,
    [switch] $DryRun,
    [switch] $Force,
    [switch] $IncludeTempClones
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$helpersPath = Join-Path $PSScriptRoot 'cleanup-agent-worktrees.helpers.ps1'
. $helpersPath

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Resolve-GitRepositoryRootFromScript -StartingDirectory $PSScriptRoot
}

$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]] $GitArguments)
    & git -C $RepoRoot @GitArguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Remove-StaleGitWorktree {
    param([Parameter(Mandatory = $true)][string] $WorktreePath)

    if (-not (Test-Path -LiteralPath $WorktreePath)) {
        Write-Host "Worktree path already gone: $WorktreePath" -ForegroundColor DarkYellow
        Invoke-Git -GitArguments @('worktree', 'prune')
        return
    }

    if ($DryRun) {
        Write-Host "[DryRun] Would remove worktree: $WorktreePath" -ForegroundColor Yellow
        return
    }

    Write-Host "Removing worktree: $WorktreePath" -ForegroundColor Cyan
    & git -C $RepoRoot worktree remove -f -f -- $WorktreePath 2>$null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "git worktree remove failed; attempting filesystem cleanup." -ForegroundColor DarkYellow
        Remove-Item -LiteralPath $WorktreePath -Recurse -Force -ErrorAction SilentlyContinue
        Invoke-Git -GitArguments @('worktree', 'prune')
    }
}

function Remove-EmptyParentDirectory {
    param([Parameter(Mandatory = $true)][string] $DirectoryPath)

    if (-not (Test-Path -LiteralPath $DirectoryPath)) { return }

    $children = @(Get-ChildItem -LiteralPath $DirectoryPath -Force -ErrorAction SilentlyContinue)
    if ($children.Count -gt 0) { return }

    if ($DryRun) {
        Write-Host "[DryRun] Would remove empty directory: $DirectoryPath" -ForegroundColor Yellow
        return
    }

    Remove-Item -LiteralPath $DirectoryPath -Force -ErrorAction SilentlyContinue
    Write-Host "Removed empty directory: $DirectoryPath" -ForegroundColor Green
}

$porcelain = (Invoke-Git -GitArguments @('worktree', 'list', '--porcelain') | Out-String)
$ephemeral = @(Get-AgentEphemeralWorktreesFromPorcelain -Porcelain $porcelain -PrimaryRepoRoot $RepoRoot)

Write-Host "Primary checkout (never removed by this script): $RepoRoot" -ForegroundColor Cyan
Write-Host "Ephemeral worktrees matched: $($ephemeral.Count)" -ForegroundColor Cyan

if ($ephemeral.Count -gt 0) {
    $ephemeral | Select-Object Path, Branch, IsLocked, LockReason | Format-Table -AutoSize
}

if (-not $Force -and -not $DryRun -and ($ephemeral.Count -gt 0 -or $IncludeTempClones)) {
    $answer = Read-Host 'Remove matched worktrees (and temp clones when -IncludeTempClones)? [y/N]'
    if ($answer -notmatch '^[yY]') {
        Write-Host 'Cancelled.' -ForegroundColor Yellow
        exit 0
    }
}

foreach ($entry in $ephemeral) {
    Remove-StaleGitWorktree -WorktreePath $entry.Path
    Remove-EmptyParentDirectory -DirectoryPath (Split-Path -Parent $entry.Path)
}

if ($IncludeTempClones) {
    $tempRoot = $env:TEMP

    if (-not [string]::IsNullOrWhiteSpace($tempRoot) -and (Test-Path -LiteralPath $tempRoot)) {
        $tempMatches = @(
            Get-ChildItem -LiteralPath $tempRoot -Directory -ErrorAction SilentlyContinue |
                Where-Object { Test-IsAgentTempCloneDirectoryName -Name $_.Name }
        )

        Write-Host "Temp clone directories: $($tempMatches.Count)" -ForegroundColor Cyan

        foreach ($dir in $tempMatches) {
            if ($DryRun) {
                Write-Host "[DryRun] Would remove temp dir: $($dir.FullName)" -ForegroundColor Yellow
                continue
            }

            Write-Host "Removing temp dir: $($dir.FullName)" -ForegroundColor Cyan
            Remove-Item -LiteralPath $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

$remainingPorcelain = (Invoke-Git -GitArguments @('worktree', 'list', '--porcelain') | Out-String)
$remainingEphemeral = @(Get-AgentEphemeralWorktreesFromPorcelain -Porcelain $remainingPorcelain -PrimaryRepoRoot $RepoRoot)
Write-Host "Remaining ephemeral worktrees: $($remainingEphemeral.Count)" -ForegroundColor Cyan

if ($remainingEphemeral.Count -gt 0) { exit 1 }
exit 0
