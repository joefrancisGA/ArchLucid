# One-shot: ensure docs/library/*.md first non-empty line is > **Scope:** (TB-013 Phase 2).
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$library = Join-Path $root 'docs\library'
$scopePattern = '^\s*>\s*\*\*Scope:\*\*'
$defaultScope = '> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.'

Get-ChildItem -LiteralPath $library -Filter '*.md' | ForEach-Object {
    $path = $_.FullName
    $lines = [System.IO.File]::ReadAllLines($path)
    $scopeIndex = -1

    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match $scopePattern) {
            $scopeIndex = $i
            break
        }
    }

    if ($scopeIndex -eq 0) {
        return
    }

    if ($scopeIndex -gt 0) {
        $scopeLine = $lines[$scopeIndex]
        $remaining = @()
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($i -ne $scopeIndex) {
                $remaining += $lines[$i]
            }
        }

        while ($remaining.Count -gt 0 -and [string]::IsNullOrWhiteSpace($remaining[0])) {
            $remaining = $remaining[1..($remaining.Count - 1)]
        }

        $newLines = @($scopeLine, '')
        if ($remaining.Count -gt 0) {
            $newLines += $remaining
        }

        [System.IO.File]::WriteAllLines($path, $newLines)
        Write-Host "Reordered Scope first: $($_.Name)"
        return
    }

    $newLines = @($defaultScope, '')
    if ($lines.Length -gt 0) {
        $newLines += $lines
    }

    [System.IO.File]::WriteAllLines($path, $newLines)
    Write-Host "Prepended Scope: $($_.Name)"
}
