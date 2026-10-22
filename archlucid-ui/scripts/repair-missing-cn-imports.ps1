Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$cnImport = 'import { cn } from "@/lib/utils";'
$cnImportPattern = '(?m)^import \{ cn \} from "@/lib/utils";?\r?\n'
$repaired = 0

function Insert-CnImport {
  param([string]$Content)

  if ($Content -match '(?m)^"use client"\r?\n') {
    return [regex]::Replace($Content, '(?m)^("use client"\r?\n)', "`$1$cnImport`n", 1)
  }

  $firstImport = [regex]::Match($Content, '(?m)^import ')

  if ($firstImport.Success) {
    return $Content.Insert($firstImport.Index, "$cnImport`n")
  }

  return "$cnImport`n$Content"
}

Get-ChildItem -LiteralPath $uiRoot -Recurse -Include *.tsx, *.ts -File |
  Where-Object { $_.FullName -notmatch '\\__snapshots__\\' } |
  ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path)
    $original = $content

    $content = [regex]::Replace($content, $cnImportPattern, '')

    if ($content -match '(?m)^export function cn\b') {
      if ($original -ne $content) {
        [System.IO.File]::WriteAllText($path, $content)
        $repaired++
        Write-Host ("deduped-self {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
      }

      return
    }

    if ($content -notmatch '\bcn\(') {
      if ($original -ne $content) {
        [System.IO.File]::WriteAllText($path, $content)
        $repaired++
        Write-Host ("deduped-only {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
      }

      return
    }

    if ($content -match '(?m)^import \{ cn \} from "@/lib/utils";?') {
      if ($original -ne $content) {
        [System.IO.File]::WriteAllText($path, $content)
        $repaired++
        Write-Host ("deduped {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
      }

      return
    }

    $content = Insert-CnImport -Content $content

    [System.IO.File]::WriteAllText($path, $content)
    $repaired++
    Write-Host ("repaired {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
  }

Write-Host ("repair-missing-cn-imports: {0} files" -f $repaired)
