#Requires -Version 5.1
<#
.SYNOPSIS
  Merge all open GitHub pull requests for the current repository (owner loop for automation queues).

.DESCRIPTION
  Used by /al-merge. Lists open PRs, merges lowest number first, repeats until the queue is empty
  or MaxRounds is reached. By default uses gh pr merge --admin so BLOCKED (required-check) PRs
  can land when the operator intentionally batch-merges aspect queues.

.EXAMPLE
  .\scripts\agent\al-merge-open-prs.ps1 -DryRun

.EXAMPLE
  .\scripts\agent\al-merge-open-prs.ps1 -RequireGreenChecks
#>
[CmdletBinding()]
param(
    [ValidateRange(1, 500)]
    [int] $Limit = 100,

    [ValidateRange(1, 100)]
    [int] $MaxRounds = 30,

    [ValidateRange(0, 60)]
    [int] $PauseSeconds = 2,

    [ValidateSet('merge', 'squash', 'rebase')]
    [string] $MergeMethod = 'merge',

    [switch] $Admin,

    [switch] $RequireGreenChecks,

    [switch] $ContinueOnError,

    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$useAdmin = $Admin.IsPresent -or (-not $RequireGreenChecks.IsPresent)

if ($RequireGreenChecks.IsPresent -and $Admin.IsPresent) {
    throw 'Use either -RequireGreenChecks or -Admin, not both.'
}

function Assert-GhAvailable {
    $gh = Get-Command gh -ErrorAction SilentlyContinue

    if ($null -eq $gh) {
        throw 'GitHub CLI (gh) is not on PATH. Install gh and run gh auth login.'
    }
}

function Get-OpenPullRequestBatch {
    param(
        [int] $BatchLimit
    )

    $raw = gh pr list --state open --limit $BatchLimit --json number,title,mergeStateStatus,mergeable,url
    $exit = $LASTEXITCODE

    if ($exit -ne 0) {
        throw "gh pr list failed with exit code $exit"
    }

    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $items = @($raw | ConvertFrom-Json)

    return @($items | Sort-Object { [int]$_.number })
}

function Merge-OnePullRequest {
    param(
        [int] $Number,
        [string] $Method,
        [bool] $UseAdminSwitch
    )

    $argList = @('pr', 'merge', [string]$Number, "--$Method")

    if ($UseAdminSwitch) {
        $argList += '--admin'
    }

    & gh @argList
    return $LASTEXITCODE
}

Assert-GhAvailable

$merged = New-Object System.Collections.Generic.List[object]
$failed = New-Object System.Collections.Generic.List[object]
$round = 0

while ($round -lt $MaxRounds) {
    $batch = Get-OpenPullRequestBatch -BatchLimit $Limit

    if ($batch.Count -eq 0) {
        break
    }

    $round++
    $nums = @($batch | ForEach-Object { [int]$_.number })
    Write-Host ("Round {0}: {1} open PR(s) - {2}" -f $round, $batch.Count, ($nums -join ', '))

    foreach ($pr in $batch) {
        $n = [int]$pr.number

        if ($DryRun) {
            Write-Host ("  [dry-run] would merge #{0} ({1}) mergeState={2} mergeable={3}" -f $n, $pr.title, $pr.mergeStateStatus, $pr.mergeable)
            continue
        }

        if ($RequireGreenChecks -and $pr.mergeStateStatus -ne 'CLEAN') {
            $msg = "PR #$n is $($pr.mergeStateStatus); skipping (-RequireGreenChecks)."
            Write-Warning $msg
            $failed.Add([pscustomobject]@{ number = $n; title = $pr.title; reason = $msg }) | Out-Null

            if (-not $ContinueOnError) {
                exit 2
            }

            continue
        }

        if ($pr.mergeable -eq 'CONFLICTING') {
            $msg = "PR #$n has merge conflicts; skipping."
            Write-Warning $msg
            $failed.Add([pscustomobject]@{ number = $n; title = $pr.title; reason = $msg }) | Out-Null

            if (-not $ContinueOnError) {
                exit 3
            }

            continue
        }

        $exitCode = Merge-OnePullRequest -Number $n -Method $MergeMethod -UseAdminSwitch $useAdmin

        if ($exitCode -ne 0) {
            $msg = "gh pr merge failed for #$n (exit $exitCode)."
            Write-Error $msg
            $failed.Add([pscustomobject]@{ number = $n; title = $pr.title; reason = $msg }) | Out-Null

            if (-not $ContinueOnError) {
                exit $exitCode
            }

            continue
        }

        Write-Host ("  merged #{0} - {1}" -f $n, $pr.title)
        $merged.Add([pscustomobject]@{ number = $n; title = $pr.title; url = $pr.url }) | Out-Null
    }

    if ($DryRun) {
        break
    }

    if ($PauseSeconds -gt 0) {
        Start-Sleep -Seconds $PauseSeconds
    }
}

$remaining = @(Get-OpenPullRequestBatch -BatchLimit $Limit)

Write-Host ''
Write-Host ('Merged: {0}  Failed: {1}  Still open: {2}  Rounds: {3}' -f $merged.Count, $failed.Count, $remaining.Count, $round)

if ($remaining.Count -gt 0 -and -not $DryRun) {
    Write-Warning 'Open PRs remain (queue may still be filling or MaxRounds reached).'
    exit 4
}

if ($failed.Count -gt 0 -and -not $ContinueOnError) {
    exit 5
}

exit 0
