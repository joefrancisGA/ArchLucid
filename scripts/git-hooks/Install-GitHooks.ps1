# Delegates to the unified hook installer (pre-commit + pre-push via core.hooksPath).
# Run from repo root: .\scripts\git-hooks\Install-GitHooks.ps1

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $here '..\..')).Path
& (Join-Path $root 'scripts/install-git-hooks.ps1')
