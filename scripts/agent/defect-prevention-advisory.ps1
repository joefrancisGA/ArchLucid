#Requires -Version 5.1
<#
.SYNOPSIS
  Prints non-blocking defect-prevention suggestions for changed paths.

.DESCRIPTION
  This is intentionally advisory. It never changes files, runs no tests, and
  always exits zero so it cannot block commits, builds, or merges.
#>
param(
    [string] $BaseRef = 'HEAD'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Advisory([string] $Message) {
    Write-Host "ADVISORY: $Message"
}

try {
    $repoRoot = (git rev-parse --show-toplevel 2>$null)
    if (-not $repoRoot) {
        Write-Advisory 'Run this command from inside the ArchLucid git repository.'
        exit 0
    }

    $changed = @(git diff --name-only $BaseRef 2>$null)
    if ($LASTEXITCODE -ne 0) {
        Write-Advisory "Could not compare against '$BaseRef'. Try -BaseRef <commit-or-branch>."
        exit 0
    }

    if ($changed.Count -eq 0) {
        Write-Advisory "No working-tree changes relative to $BaseRef."
        exit 0
    }

    Write-Host "Defect-prevention suggestions for $($changed.Count) changed path(s):"
    $normalized = $changed -join "`n"

    if ($normalized -match '(^|\n)(ArchLucid\.Api/Controllers/|.*Controller\.cs$|.*Endpoint.*\.cs$)') {
        Write-Advisory 'API change: review authorization, tenant/object scope, validation, stable errors, idempotency, and typed audit events.'
    }
    if ($normalized -match '(^|\n)(ArchLucid\.Persistence|.*Migration.*\.cs$|.*\.sql$)') {
        Write-Advisory 'Persistence change: document rollout compatibility, retry/partial-failure behavior, backfill, recovery, and query scope/pagination.'
    }
    if ($normalized -match '(^|\n)archlucid-ui/') {
        Write-Advisory 'UI change: check loading, empty, error, permission-denied, stale-data, and double-submit states.'
    }
    if ($normalized -match '(appsettings|Configuration|Options|\.ya?ml$|\.json$)') {
        Write-Advisory 'Configuration change: check defaults, invalid combinations, environment overrides, secret handling, and backward compatibility.'
    }
    if ($normalized -match '(package-lock\.json|package\.json|\.csproj$|Directory\.Packages\.props$)') {
        Write-Advisory 'Dependency change: inspect release notes, lockfile/transitive changes, licensing, and rollback options.'
    }
    if ($normalized -match '(Date|Time|Money|Currency|Amount|Rate)') {
        Write-Advisory 'Date/time or numeric domain change: confirm UTC, culture-independent parsing, rounding, and range boundaries.'
    }

    Write-Advisory 'For a bug fix, retain a reproducible failing scenario and check the nearest boundary case.'
    Write-Advisory 'Record one focused local command or manual scenario that a reviewer can repeat.'
}
catch {
    Write-Advisory "Unable to generate suggestions: $($_.Exception.Message)"
}

exit 0
