#Requires -Version 5.1
<#
.SYNOPSIS
  Commits scoped paths on an isolated worktree and pushes to a target branch (default: master).

.DESCRIPTION
  Used by /al-bug when the main ArchLucid working tree has unrelated dirty files.
  Creates a short-lived worktree from origin/<TargetBranch>, copies listed files,
  commits, pushes, then removes the worktree.

.PARAMETER Paths
  Repo-relative file paths to stage (only these files).

.PARAMETER CommitMessage
  Commit message body (required).

.PARAMETER TargetBranch
  Remote branch to push to. Default: master.

.PARAMETER DryRun
  Preview actions without commit or push.

.EXAMPLE
  .\scripts\agent\al-bug-push-master.ps1 `
    -Paths @('ArchLucid.Application/Runs/Orchestration/Foo.cs') `
    -CommitMessage 'Fix edge alias resolution for renamed services.'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string[]] $Paths,

    [Parameter(Mandatory = $true)]
    [string] $CommitMessage,

    [string] $TargetBranch = 'master',

    [switch] $DryRun
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

$repoRoot = Get-RepoRoot
Set-Location -LiteralPath $repoRoot

$normalizedPaths = @()

foreach ($path in $Paths) {
    $relative = $path -replace '\\', '/'
    $full = Join-Path $repoRoot ($relative -replace '/', [IO.Path]::DirectorySeparatorChar)

    if (-not (Test-Path -LiteralPath $full)) {
        throw "Path not found: $relative"
    }

    $normalizedPaths += $relative
}

$worktreeBranch = "fix/al-bug-push-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$worktreePath = Join-Path (Split-Path -Parent $repoRoot) "ArchLucid-al-bug-$worktreeBranch"

Write-Host "Repo root:      $repoRoot"
Write-Host "Target branch:  $TargetBranch"
Write-Host "Worktree:       $worktreePath"
Write-Host "Files:          $($normalizedPaths -join ', ')"

if ($DryRun) {
    Write-Host '[DryRun] Would fetch, create worktree, copy files, commit, and push.'
    exit 0
}

git fetch origin $TargetBranch

if (Test-Path -LiteralPath $worktreePath) {
    git worktree remove --force $worktreePath 2>$null
    Remove-Item -Recurse -Force $worktreePath -ErrorAction SilentlyContinue
}

git worktree add -b $worktreeBranch $worktreePath "origin/$TargetBranch"

try {
    foreach ($relative in $normalizedPaths) {
        $src = Join-Path $repoRoot ($relative -replace '/', [IO.Path]::DirectorySeparatorChar)
        $dst = Join-Path $worktreePath ($relative -replace '/', [IO.Path]::DirectorySeparatorChar)
        $dstDir = Split-Path -Parent $dst

        if (-not (Test-Path -LiteralPath $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $src -Destination $dst -Force
    }

    Set-Location -LiteralPath $worktreePath
    git add -- $normalizedPaths
    git commit -m $CommitMessage
    git push origin "${worktreeBranch}:${TargetBranch}"

    $sha = (git rev-parse HEAD).Trim()
    Write-Host "Pushed ${TargetBranch} @ $sha"
    exit 0
}
finally {
    Set-Location -LiteralPath $repoRoot

    if (Test-Path -LiteralPath $worktreePath) {
        git worktree remove --force $worktreePath 2>$null
    }

    git branch -D $worktreeBranch 2>$null | Out-Null
}
