# Merges duplicate single-line `@/lib/design-tokens` imports and adds missing OPERATOR_TYPOGRAPHY.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Join-Path (Join-Path (Join-Path $PSScriptRoot '..') '..') 'archlucid-ui\src'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Include *.tsx, *.ts |
    Where-Object { $_.Name -ne 'design-tokens.ts' }

$valueImportPattern = '^import \{([^}]+)\} from "@/lib/design-tokens";$'
$typeImportPattern = '^import type \{([^}]+)\} from "@/lib/design-tokens";$'
$usesTypographyPattern = 'OPERATOR_TYPOGRAPHY[\.\)]'
$changedFiles = [System.Collections.Generic.List[string]]::new()

function Add-Symbols {
    param(
        [System.Collections.Generic.HashSet[string]]$Target,
        [string]$RawList
    )

    foreach ($symbol in ($RawList -split ',')) {
        $trimmed = $symbol.Trim()

        if ($trimmed.Length -gt 0) {
            [void]$Target.Add($trimmed)
        }
    }
}

foreach ($file in $files) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([string[]](([System.IO.File]::ReadAllText($file.FullName)) -split "`r?`n"))

    if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') {
        $lines.RemoveAt($lines.Count - 1)
    }

    $content = $lines -join "`n"
    $usesOperatorTypography = $content -match $usesTypographyPattern

    $importIndexes = [System.Collections.Generic.List[int]]::new()
    $valueSymbols = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    $typeSymbols = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)

    for ($index = 0; $index -lt $lines.Count; $index++) {
        $line = $lines[$index]

        if ($line -match $typeImportPattern) {
            $importIndexes.Add($index)
            Add-Symbols -Target $typeSymbols -RawList $Matches[1]
            continue
        }

        if ($line -match $valueImportPattern) {
            $importIndexes.Add($index)
            Add-Symbols -Target $valueSymbols -RawList $Matches[1]
        }
    }

    if ($importIndexes.Count -eq 0) {
        if (-not $usesOperatorTypography) {
            continue
        }

        $insertAt = $null

        for ($index = 0; $index -lt $lines.Count; $index++) {
            $trimmed = $lines[$index].Trim()

            if ($trimmed -eq '"use client";' -or $trimmed -eq "'use client';" -or $trimmed.Length -eq 0) {
                continue
            }

            if ($trimmed.StartsWith('import ') -and $trimmed -notmatch ';$') {
                continue
            }

            if ($trimmed.StartsWith('import ') -or $trimmed.StartsWith('export ')) {
                continue
            }

            $insertAt = $index
            break
        }

        if ($null -eq $insertAt) {
            continue
        }

        $lines.Insert($insertAt, 'import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";')
        [System.IO.File]::WriteAllText($file.FullName, (($lines -join "`n") + "`n"))
        $changedFiles.Add($file.FullName)
        continue
    }

    $needsOperatorTypography = $usesOperatorTypography -and -not $valueSymbols.Contains('OPERATOR_TYPOGRAPHY')
    $needsMerge = $importIndexes.Count -gt 1

    if (-not $needsMerge -and -not $needsOperatorTypography) {
        continue
    }

    if ($needsOperatorTypography) {
        [void]$valueSymbols.Add('OPERATOR_TYPOGRAPHY')
    }

    $mergedParts = [System.Collections.Generic.List[string]]::new()

    foreach ($symbol in ($valueSymbols | Sort-Object)) {
        $mergedParts.Add($symbol)
    }

    foreach ($symbol in ($typeSymbols | Sort-Object)) {
        $mergedParts.Add("type $symbol")
    }

    $mergedImport = "import { $($mergedParts -join ', ') } from `"@/lib/design-tokens`";"
    $firstIndex = $importIndexes[0]
    $lines[$firstIndex] = $mergedImport

    for ($offset = $importIndexes.Count - 1; $offset -ge 1; $offset--) {
        $lines.RemoveAt($importIndexes[$offset])
    }

    [System.IO.File]::WriteAllText($file.FullName, (($lines -join "`n") + "`n"))
    $changedFiles.Add($file.FullName)
}

Write-Host "Repaired design-tokens imports in $($changedFiles.Count) file(s)."
