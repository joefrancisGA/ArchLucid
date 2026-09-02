#Requires -Version 5.1
<#
.SYNOPSIS
  Checks out the /al-bug integration branch and pulls the latest from origin.

.DESCRIPTION
  Used at the start of every /al-bug run (except --status) so hunts begin from
  the current tip of the shared bugsmash branch.

.PARAMETER TargetBranch
  Remote branch to sync. Default: bugsmash.

.EXAMPLE
  .\scripts\agent\al-bug-sync-branch.ps1
#>
[CmdletBinding()]
param(
    [string] $TargetBranch = 'bugsmash'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    $dir = $PSScriptRoot
    while ($null -ne $dir) {
        if (Test-Path -LiteralPath (Join-Path $dir '.git')) {
            return (Resolve-Path -LiteralPath $dir).Path
        }

        $parent = Split-Path -Parent $dir

        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $dir) {
            break
        }

        $dir = $parent
    }

    throw 'Could not locate git repository root from scripts/agent.'
}

function Test-GitRefExists {
    param([string] $Ref)

    git show-ref --verify --quiet $Ref 2>$null | Out-Null

    return $LASTEXITCODE -eq 0
}

$repoRoot = Get-RepoRoot
Set-Location -LiteralPath $repoRoot

Write-Host "Syncing /al-bug branch: $TargetBranch"

git fetch origin $TargetBranch 2>$null | Out-Null
$fetchExit = $LASTEXITCODE

$localBranchExists = Test-GitRefExists -Ref "refs/heads/$TargetBranch"
$remoteBranchExists = Test-GitRefExists -Ref "refs/remotes/origin/$TargetBranch"

if (-not $localBranchExists) {
    if ($remoteBranchExists) {
        git checkout -b $TargetBranch "origin/$TargetBranch"
    }
    else {
        if ($fetchExit -ne 0) {
            git fetch origin master | Out-Null
        }

        git checkout -b $TargetBranch origin/master
        Write-Host "Created local $TargetBranch from origin/master (remote branch not found yet)."
    }
}
else {
    git checkout $TargetBranch | Out-Null
}

if ($remoteBranchExists) {
    git pull --rebase origin $TargetBranch
}
else {
    Write-Host "Remote origin/$TargetBranch not found; continuing on local branch."
}

$sha = (git rev-parse HEAD).Trim()
Write-Host "Ready on $TargetBranch @ $sha"
