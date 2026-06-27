# Removes erroneous OPERATOR_TYPOGRAPHY lines inserted inside multiline import blocks.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Join-Path (Join-Path (Join-Path $PSScriptRoot '..') '..') 'archlucid-ui\src'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Include *.tsx, *.ts
$pattern = "import \{\r?\nimport \{ OPERATOR_TYPOGRAPHY \} from `"@/lib/design-tokens`";\r?\n"
$changed = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)

    if ($content -notmatch $pattern) {
        continue
    }

    $fixed = [regex]::Replace($content, $pattern, "import {`n")
    [System.IO.File]::WriteAllText($file.FullName, $fixed)
    $changed++
    Write-Host $file.FullName
}

Write-Host "Fixed $changed file(s)."
