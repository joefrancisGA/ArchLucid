# Installs the shared pre-commit hook from scripts/hooks/ into .git/hooks/.
# Run once after cloning: pwsh scripts/install-git-hooks.ps1
#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$HooksSrc   = Join-Path $ScriptDir 'hooks'
$RepoRoot   = (& git -C $ScriptDir rev-parse --show-toplevel).Trim()
$GitDirName = (& git -C $ScriptDir rev-parse --git-dir).Trim()

if ([System.IO.Path]::IsPathRooted($GitDirName)) {
    $GitDir = $GitDirName
}
else {
    $GitDir = Join-Path $RepoRoot $GitDirName
}

$GitHooksDir = Join-Path $GitDir 'hooks'

function Install-Hook {
    param([string]$Name)
    $src  = Join-Path $HooksSrc $Name
    $dest = Join-Path $GitHooksDir $Name

    if (-not (Test-Path $src)) {
        Write-Host "  skip: $Name (no source file)"
        return
    }

    # Bash hooks must be LF; Copy-Item preserves CRLF on Windows and breaks pre-commit.
    $content = [System.IO.File]::ReadAllText($src) -replace "`r`n", "`n" -replace "`r", "`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($dest, $content, $utf8NoBom)
    Write-Host "  installed: $Name"
}

Write-Host "Installing git hooks from $HooksSrc -> $GitHooksDir"
Install-Hook 'pre-commit'

# Hook helpers are sourced from the repo; keep LF so bash does not hang on CRLF.
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
foreach ($helper in @('resolve-python.sh')) {
    $helperSrc = Join-Path $HooksSrc $helper
    if (Test-Path -LiteralPath $helperSrc) {
        $content = [System.IO.File]::ReadAllText($helperSrc) -replace "`r`n", "`n" -replace "`r", "`n"
        [System.IO.File]::WriteAllText($helperSrc, $content, $utf8NoBom)
        Write-Host "  normalized LF: hooks/$helper"
    }
}

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

Write-Host 'Done. Run ''git commit --no-verify'' to bypass in emergencies.'
