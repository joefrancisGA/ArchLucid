# Removes duplicate `import { cn } from "@/lib/utils";` lines (typography migration artifact).
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$cnImportLine = 'import { cn } from "@/lib/utils";'
$root = Join-Path (Join-Path (Join-Path $PSScriptRoot '..') '..') 'archlucid-ui\src'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Include *.tsx, *.ts
$changedFiles = [System.Collections.Generic.List[string]]::new()

foreach ($file in $files) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([string[]](([System.IO.File]::ReadAllText($file.FullName)) -split "`r?`n"))

    if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') {
        $lines.RemoveAt($lines.Count - 1)
    }

    $cnSeen = $false
    $changed = $false

    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -ne $cnImportLine) {
            continue
        }

        if ($cnSeen) {
            $lines.RemoveAt($index)
            $index--
            $changed = $true
            continue
        }

        $cnSeen = $true
    }

    if (-not $changed) {
        continue
    }

    [System.IO.File]::WriteAllText($file.FullName, (($lines -join "`n") + "`n"))
    $changedFiles.Add($file.FullName)
}

Write-Host "Removed duplicate cn imports from $($changedFiles.Count) file(s)."
