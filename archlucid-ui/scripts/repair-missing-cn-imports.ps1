Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$cnImport = 'import { cn } from "@/lib/utils";'
$repaired = 0

Get-ChildItem -LiteralPath $uiRoot -Recurse -Include *.tsx, *.ts -File |
  Where-Object { $_.FullName -notmatch '\\__snapshots__\\' } |
  ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path)
    $original = $content

    $content = [regex]::Replace($content, '(?m)^import \{ cn \} from "@/lib/utils";\r?\n', '')

    if ($content -notmatch '\bcn\(') {
      if ($original -ne $content) {
        [System.IO.File]::WriteAllText($path, $content)
        $repaired++
        Write-Host ("deduped-only {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
      }

      return
    }

    if ($content -match '(?m)^import \{ cn \} from "@/lib/utils";') {
      if ($original -ne $content) {
        [System.IO.File]::WriteAllText($path, $content)
        $repaired++
        Write-Host ("deduped {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
      }

      return
    }

    if ($content -match '(?m)^"use client";\r?\n') {
      $content = [regex]::Replace($content, '(?m)^("use client";\r?\n)', "`$1$cnImport`n", 1)
    }
    elseif ($content -match '(?m)^import ') {
      $content = [regex]::Replace($content, '(?m)^import ', "$cnImport`nimport ", 1)
    }
    else {
      $content = "$cnImport`n$content"
    }

    [System.IO.File]::WriteAllText($path, $content)
    $repaired++
    Write-Host ("repaired {0}" -f $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, ""))
  }

Write-Host ("repair-missing-cn-imports: {0} files" -f $repaired)
