#Requires -Version 5.1
# sessionStart: record tracked files with unstaged diffs at session start.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$null = [Console]::In.ReadToEnd()

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    exit 0
}

Set-Location -LiteralPath $repoRoot
$baselineDir = Join-Path $repoRoot '.cursor'
if (-not (Test-Path -LiteralPath $baselineDir)) {
    New-Item -ItemType Directory -Path $baselineDir -Force | Out-Null
}

$baselineFile = Join-Path $baselineDir '.agent-dirty-baseline.txt'
$dirty = git diff --name-only --diff-filter=ACMRTUXB
if ($null -eq $dirty) {
    $dirty = @()
}

$dirty | Set-Content -LiteralPath $baselineFile -Encoding utf8
exit 0
