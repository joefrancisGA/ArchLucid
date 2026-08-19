#Requires -Version 5.1
<#
.SYNOPSIS
  Exit 2 when a tracked file had unstaged changes at agent session start (baseline).

.DESCRIPTION
  Used by agents and Cursor hooks to avoid overwriting the user's unstaged work.
  Override for one invocation: set ARCHLUCID_AGENT_ALLOW_DIRTY=1.

  Exit codes: 0 = safe; 2 = blocked (dirty at baseline); 1 = usage/error.
#>
param(
    [Parameter(Mandatory = $true)]
    [string[]] $Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:ARCHLUCID_AGENT_ALLOW_DIRTY -eq '1') {
    exit 0
}

$repoRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    Write-Error 'Not inside a git repository.'
    exit 1
}

$baselineFile = Join-Path $repoRoot '.cursor\.agent-dirty-baseline.txt'
$baseline = @{}
if (Test-Path -LiteralPath $baselineFile) {
    Get-Content -LiteralPath $baselineFile -ErrorAction SilentlyContinue |
        ForEach-Object { $baseline[$_] = $true }
}

$blocked = New-Object System.Collections.Generic.List[string]

foreach ($raw in $Path) {
    $full = $raw
    if (-not [System.IO.Path]::IsPathRooted($raw)) {
        $full = Join-Path (Get-Location).Path $raw
    }

    $full = [System.IO.Path]::GetFullPath($full)
    if (-not $full.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
        continue
    }

    $relative = $full.Substring($repoRoot.Length).TrimStart('\', '/').Replace('\', '/')
    if ([string]::IsNullOrWhiteSpace($relative)) {
        continue
    }

    # Untracked new files are not in baseline — safe to create.
    $tracked = git ls-files --error-unmatch -- $relative 2>$null
    if ($LASTEXITCODE -ne 0) {
        continue
    }

    if ($baseline.ContainsKey($relative)) {
        [void]$blocked.Add($relative)
    }
}

if ($blocked.Count -gt 0) {
    Write-Host 'BLOCKED: path(s) had unstaged changes at session start (not agent-owned):'
    $blocked | ForEach-Object { Write-Host "  $_" }
    Write-Host 'Resolve: stash/commit user changes, pick other files, or set ARCHLUCID_AGENT_ALLOW_DIRTY=1 with explicit user approval.'
    exit 2
}

exit 0
