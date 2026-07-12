# Installs shared git hooks via core.hooksPath (pre-commit + OpenAPI pre-push).
# Run once after cloning: pwsh scripts/install-git-hooks.ps1
#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (& git -C $ScriptDir rev-parse --show-toplevel).Trim()
$GitHooksDir = Join-Path $RepoRoot 'scripts/git-hooks'

function Set-HookFileLineEndings {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "  skip: $Path (missing)"
        return
    }

    $content = [System.IO.File]::ReadAllText($Path) -replace "`r`n", "`n" -replace "`r", "`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $content, $utf8NoBom)
    Write-Host "  normalized LF: $Path"
}

Set-Location $RepoRoot
& git config core.hooksPath scripts/git-hooks

Write-Host "Installing git hooks from $GitHooksDir (core.hooksPath)"
Set-HookFileLineEndings (Join-Path $GitHooksDir 'pre-commit')
Set-HookFileLineEndings (Join-Path $GitHooksDir 'pre-push')
Set-HookFileLineEndings (Join-Path $GitHooksDir 'post-checkout')
Set-HookFileLineEndings (Join-Path $RepoRoot 'scripts/hooks/post-checkout')

$helper = Join-Path $RepoRoot 'scripts/hooks/resolve-python.sh'
Set-HookFileLineEndings $helper

$pythonCandidates = @(
    'C:\Python313\python.exe',
    'C:\Python312\python.exe',
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe"
)
foreach ($py in $pythonCandidates) {
    if (Test-Path -LiteralPath $py) {
        $normalized = $py -replace '\\', '/'
        & git config --local archlucid.python $normalized
        Write-Host "  configured: archlucid.python -> $normalized"
        break
    }
}

Write-Host 'Hooks enabled:'
Write-Host '  pre-commit    — owner-workbook guard + controller audit + route registry sync (when staged paths match)'
Write-Host '  post-checkout — removes resurrected legacy ui_route_traffic_estimates.md after branch switches'
Write-Host '  pre-push      — OpenAPI v1 + buyer snapshot check (when outgoing commits touch API paths)'
Write-Host ''
Write-Host 'Skip pre-commit once: ARCHLUCID_SKIP_PRE_COMMIT=1 git commit'
Write-Host 'Skip pre-push once:   ARCHLUCID_SKIP_OPENAPI_PRE_PUSH=1 git push'
Write-Host 'OpenAPI build cache:  .cache/nuget-packages + incremental Release build under each project obj/bin'
Write-Host 'Emergency bypass:     git commit --no-verify / git push --no-verify'
