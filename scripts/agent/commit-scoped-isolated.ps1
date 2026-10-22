<#
.SYNOPSIS
    Commits an explicit set of paths without touching the repository's shared index.

.DESCRIPTION
    When another agent or a developer has files staged in the shared index, a normal
    `git add` + `git commit` sweeps their staged content into the commit. This script
    builds the commit in a private index (GIT_INDEX_FILE), then moves the branch ref
    with a compare-and-swap so a concurrent commit cannot be lost.

    After the ref moves, the shared index still holds the pre-commit blobs for the
    committed paths, which would show up as staged reversions for other sessions.
    A scoped `git reset -- <paths>` realigns just those entries with the new HEAD.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Branch,
    [Parameter(Mandatory = $true)][string]$Message,
    [Parameter(Mandatory = $true)][string[]]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-GitWithLockRetry {
    param([string[]]$GitArgs)

    for ($attempt = 1; $attempt -le 40; $attempt++) {
        $output = & git @GitArgs 2>&1
        if ($LASTEXITCODE -eq 0) { return $output }

        # A concurrent git process holds index.lock; back off and retry rather than fail the commit.
        if ($output -notmatch 'index\.lock') { throw ("git {0} failed: {1}" -f ($GitArgs -join ' '), ($output -join "`n")) }

        Start-Sleep -Milliseconds 500
    }

    throw ("git {0} kept hitting index.lock" -f ($GitArgs -join ' '))
}

$refName = "refs/heads/$Branch"
$parent = (& git rev-parse $refName).Trim()
$indexFile = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-agent-index-" + [System.Guid]::NewGuid().ToString('N'))

try {
    $env:GIT_INDEX_FILE = $indexFile

    & git read-tree $parent
    if ($LASTEXITCODE -ne 0) { throw "read-tree failed for $parent" }

    & git add --all -- $Path
    if ($LASTEXITCODE -ne 0) { throw 'add failed' }

    $tree = (& git write-tree).Trim()
    $commit = (& git commit-tree $tree -p $parent -m $Message).Trim()
}
finally {
    Remove-Item env:GIT_INDEX_FILE -ErrorAction SilentlyContinue
    Remove-Item $indexFile -Force -ErrorAction SilentlyContinue
}

# Compare-and-swap: fails if the branch moved while the commit was being built.
& git update-ref $refName $commit $parent
if ($LASTEXITCODE -ne 0) { throw "branch $Branch moved from $parent; rebuild the commit" }

Invoke-GitWithLockRetry -GitArgs (@('reset', '--quiet', '--') + $Path) | Out-Null

Write-Host ("committed {0} on {1} ({2} paths)" -f $commit.Substring(0, 9), $Branch, $Path.Count)
