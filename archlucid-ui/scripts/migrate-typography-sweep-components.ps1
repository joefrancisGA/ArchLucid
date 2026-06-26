# Bulk typography token sweep for src/components — converts ad-hoc text-* sizes to cn(OPERATOR_TYPOGRAPHY.*).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$componentsRoot = Join-Path $uiRoot "components"
$dryRun = $env:ARCHLUCID_TYPOGRAPHY_SWEEP_DRY_RUN -eq "1"

$adHocSizePattern = '(?:\btext-(?:xs|sm|base|xl)|text-\[[0-9]+px\])'

function Get-TypographyTokenForClasses {
  param([string]$Classes)

  if ($Classes -match '\btext-xl\b') {
    return "OPERATOR_TYPOGRAPHY.pageTitle"
  }

  if ($Classes -match '\btext-base\b') {
    return "OPERATOR_TYPOGRAPHY.body"
  }

  if ($Classes -match '\btext-sm\b') {
    if ($Classes -match 'font-semibold' -and $Classes -notmatch 'uppercase') {
      return "OPERATOR_TYPOGRAPHY.cardTitle"
    }

    return "OPERATOR_TYPOGRAPHY.body"
  }

  if ($Classes -match '\btext-\[10px\]' -and $Classes -match 'uppercase') {
    return "OPERATOR_NAV_GROUP_LABEL"
  }

  if ($Classes -match '\btext-\[10px\]') {
    return "OPERATOR_TYPOGRAPHY.badge"
  }

  return "OPERATOR_TYPOGRAPHY.helper"
}

function Remove-AdHocSizes {
  param([string]$Classes)

  $cleaned = [regex]::Replace($Classes, $adHocSizePattern, "")
  $cleaned = [regex]::Replace($cleaned, '\s{2,}', " ").Trim()

  return $cleaned
}

function Repair-DuplicateImports {
  param([string]$Content)

  $typographyImport = 'import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";'
  $cnImport = 'import { cn } from "@/lib/utils";'

  $hasTypography = $Content -match 'OPERATOR_TYPOGRAPHY'
  $hasCn = $Content -match '\bcn\('

  $Content = [regex]::Replace($Content, '(?m)^import \{ OPERATOR_TYPOGRAPHY \} from "@/lib/design-tokens";\r?\n', '')
  $Content = [regex]::Replace($Content, '(?m)^import \{ cn \} from "@/lib/utils";\r?\n', '')

  # Consolidated design-tokens import may include NAV label from prior passes.
  $Content = [regex]::Replace($Content, '(?m)^import \{[^}]*OPERATOR_NAV_GROUP_LABEL[^}]*\} from "@/lib/design-tokens";\r?\n', '')

  if ($hasTypography -or $hasCn) {
    $block = ""
    if ($hasTypography) {
      if ($Content -match 'OPERATOR_NAV_GROUP_LABEL') {
        $block += 'import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";' + "`n"
      }
      else {
        $block += $typographyImport + "`n"
      }
    }

    if ($hasCn) {
      $block += $cnImport + "`n"
    }

    if ($Content -match '(?m)^"use client";\r?\n') {
      $Content = [regex]::Replace($Content, '(?m)^("use client";\r?\n)', '${1}' + $block, 1)
    }
    else {
      $Content = $block + $Content
    }
  }

  return $Content
}

function Ensure-DesignTokenImports {
  param([string]$Content, [bool]$NeedsNavGroupLabel)

  $needsTypography = $Content -match 'OPERATOR_TYPOGRAPHY\.'
  $needsCn = $Content -match '\bcn\('

  if (-not $needsTypography -and -not $needsCn) {
    return $Content
  }

  if ($Content -match 'from "@/lib/design-tokens"') {
    if ($needsNavGroupLabel -and $Content -notmatch 'OPERATOR_NAV_GROUP_LABEL') {
      $Content = [regex]::Replace(
        $Content,
        '(import \{)([^}]*)(\} from "@/lib/design-tokens")',
        {
          param($m)
          $inner = $m.Groups[2].Value.Trim()
          if ($inner.Length -gt 0) {
            return "$($m.Groups[1].Value) $inner, OPERATOR_NAV_GROUP_LABEL$($m.Groups[3].Value)"
          }

          return "$($m.Groups[1].Value) OPERATOR_NAV_GROUP_LABEL$($m.Groups[3].Value)"
        },
        1
      )
    }

    if ($needsTypography -and $Content -notmatch 'OPERATOR_TYPOGRAPHY') {
      $Content = [regex]::Replace(
        $Content,
        '(import \{)([^}]*)(\} from "@/lib/design-tokens")',
        {
          param($m)
          $inner = $m.Groups[2].Value.Trim()
          if ($inner.Length -gt 0) {
            return "$($m.Groups[1].Value) $inner, OPERATOR_TYPOGRAPHY$($m.Groups[3].Value)"
          }

          return "$($m.Groups[1].Value) OPERATOR_TYPOGRAPHY$($m.Groups[3].Value)"
        },
        1
      )
    }
  }
  else {
    $importLine = 'import { OPERATOR_TYPOGRAPHY'
    if ($NeedsNavGroupLabel) {
      $importLine += ', OPERATOR_NAV_GROUP_LABEL'
    }

    $importLine += ' } from "@/lib/design-tokens";'

    if ($needsCn -and $Content -notmatch 'from "@/lib/utils"') {
      $importLine += "`nimport { cn } from `"@/lib/utils`";"
    }

    $Content = [regex]::Replace($Content, '(\r?\n)(import )', '${1}' + $importLine + "`n" + '${2}', 1)
  }

  if ($needsCn -and $Content -notmatch 'from "@/lib/utils"') {
    $Content = [regex]::Replace($Content, '(\r?\n)(import )', '${1}import { cn } from "@/lib/utils";' + "`n" + '${2}', 1)
  }

  return $Content
}

function Convert-QuotedClassNames {
  param([string]$Content)

  $pattern = 'className="([^"]*)"'

  return [regex]::Replace($Content, $pattern, {
    param($m)
    $classes = $m.Groups[1].Value

    if ($classes -notmatch $adHocSizePattern) {
      return $m.Value
    }

    if ($classes -match '\btext-\[10px\]' -and $classes -match 'uppercase') {
      $script:FileNeedsNavGroupLabel = $true
    }

    $token = Get-TypographyTokenForClasses -Classes $classes
    $cleaned = Remove-AdHocSizes -Classes $classes

    if ($cleaned.Length -eq 0) {
      return "className={$token}"
    }

    return "className={cn(`"$cleaned`", $token)}"
  })
}

function Convert-TemplateClassNames {
  param([string]$Content)

  $pattern = 'className=\{\`([^\`]*)\`\}'
  return [regex]::Replace($Content, $pattern, {
    param($m)
    $classes = $m.Groups[1].Value

    if ($classes -notmatch $adHocSizePattern) {
      return $m.Value
    }

    if ($classes -match '\btext-\[10px\]' -and $classes -match 'uppercase') {
      $script:FileNeedsNavGroupLabel = $true
    }

    $token = Get-TypographyTokenForClasses -Classes $classes
    $cleaned = Remove-AdHocSizes -Classes $classes

    if ($cleaned.Length -eq 0) {
      return "className={$token}"
    }

    return "className={cn(`"$cleaned`", $token)}"
  })
}

function Convert-EmbeddedClassLiterals {
  param([string]$Content)

  $pattern = '"([^"]*(?:\btext-(?:xs|sm|base|xl)|text-\[[0-9]+px\])[^"]*)"'
  return [regex]::Replace($Content, $pattern, {
    param($m)
    $full = $m.Value
    $classes = $m.Groups[1].Value

    if ($classes -match '[?=&/]|^\s*(GET|POST|PUT|DELETE)\s') {
      return $full
    }

    if ($classes -notmatch '(?:dark:|neutral|font-|uppercase|tracking|leading|tabular|mono|truncate|rounded|border|bg-|px-|py-|p-|m-|gap-|flex|grid|max-w|min-w|text-al-|text-teal|text-neutral|text-red|text-amber|text-violet|text-sky|text-emerald|underline|hover:|shadow|whitespace|items-|justify-|col-|row-|space-|ring-|focus-|disabled:|cursor-|overflow-|line-clamp|break-|shrink-|grow-|w-|h-|z-|top-|bottom-|left-|right-|inset-|sr-only|not-sr-only|list-|divide-|opacity-|transition-|animate-|pointer-events|select-none|sr-only)' ) {
      return $full
    }

    if ($classes -notmatch $adHocSizePattern) {
      return $full
    }

    if ($classes -match '\btext-\[10px\]' -and $classes -match 'uppercase') {
      $script:FileNeedsNavGroupLabel = $true
    }

    $token = Get-TypographyTokenForClasses -Classes $classes
    $cleaned = Remove-AdHocSizes -Classes $classes

    if ($cleaned.Length -eq 0) {
      return "{$token}"
    }

    return "(cn(`"$cleaned`", $token))"
  })
}

function Convert-CnClassNames {
  param([string]$Content)

  # Strip ad-hoc sizes from simple cn("...", ...) first arg when entire attr is one cn call.
  $pattern = 'className=\{cn\(\s*"([^"]*?)"'
  return [regex]::Replace($Content, $pattern, {
    param($m)
    $classes = $m.Groups[1].Value

    if ($classes -notmatch $adHocSizePattern) {
      return $m.Value
    }

    $token = Get-TypographyTokenForClasses -Classes $classes
    $cleaned = Remove-AdHocSizes -Classes $classes

    if ($cleaned.Length -eq 0) {
      return "className={cn($token"
    }

    return "className={cn(`"$cleaned`", $token"
  })
}

$changedFiles = 0
$totalHits = 0

Get-ChildItem -LiteralPath $componentsRoot -Recurse -Include *.tsx, *.ts -File |
  Where-Object { $_.FullName -notmatch '\\__snapshots__\\' } |
  ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path)

    if ($content -notmatch $adHocSizePattern) {
      return
    }

    $script:FileNeedsNavGroupLabel = $false
    $updated = Convert-QuotedClassNames -Content $content
    $updated = Convert-TemplateClassNames -Content $updated
    $updated = Convert-CnClassNames -Content $updated
    $updated = Convert-EmbeddedClassLiterals -Content $updated
    $updated = Ensure-DesignTokenImports -Content $updated -NeedsNavGroupLabel $script:FileNeedsNavGroupLabel
    $updated = Repair-DuplicateImports -Content $updated

    if ($updated -ne $content) {
      $before = ([regex]::Matches($content, $adHocSizePattern)).Count
      $after = ([regex]::Matches($updated, $adHocSizePattern)).Count
      $hits = $before - $after
      $rel = $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, "")

      if ($dryRun) {
        Write-Host ("DRY {0} (-{1}, left {2})" -f $rel, $hits, $after)
      }
      else {
        [System.IO.File]::WriteAllText($path, $updated)
        Write-Host ("{0} (-{1}, left {2})" -f $rel, $hits, $after)
      }

      $changedFiles++
      $totalHits += $hits
    }
  }

Write-Host ""
Write-Host ("Typography sweep: {0} files touched, ~{1} ad-hoc sizes removed." -f $changedFiles, $totalHits)

$dedupedFiles = 0
Get-ChildItem -LiteralPath $componentsRoot -Recurse -Include *.tsx, *.ts -File |
  Where-Object { $_.FullName -notmatch '\\__snapshots__\\' } |
  ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path)

    $typographyImportCount = ([regex]::Matches($content, '(?m)^import \{ OPERATOR_TYPOGRAPHY \}')).Count

    if ($typographyImportCount -lt 2) {
      return
    }

    $repaired = Repair-DuplicateImports -Content $content

    if ($repaired -ne $content) {
      $rel = $path.Replace($uiRoot + [IO.Path]::DirectorySeparatorChar, "")

      if ($dryRun) {
        Write-Host ("DRY dedupe {0}" -f $rel)
      }
      else {
        [System.IO.File]::WriteAllText($path, $repaired)
        Write-Host ("dedupe {0}" -f $rel)
      }

      $dedupedFiles++
    }
  }

if ($dedupedFiles -gt 0) {
  Write-Host ("Import dedupe: {0} files repaired." -f $dedupedFiles)
}
