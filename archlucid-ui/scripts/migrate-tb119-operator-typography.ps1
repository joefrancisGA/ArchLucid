# TB-119: normalize operator typography to Carbon-scale tokens (class strings only).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$roots = @(
  (Join-Path $uiRoot "app\(operator)"),
  (Join-Path $uiRoot "app\(executive)"),
  (Join-Path $uiRoot "components")
)

$pageTitle = "text-xl font-semibold tracking-tight text-al-text-primary"
$sectionTitle = "text-xs font-semibold uppercase tracking-wide text-al-text-secondary"
$cardTitle = "text-sm font-semibold text-al-text-primary"
$kpiValue = "font-mono text-4xl font-semibold tabular-nums text-al-text-primary"

$replacements = [ordered]@{
  "text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50" = $pageTitle
  "text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100" = $pageTitle
  "m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100" = "m-0 $pageTitle"
  "text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100" = $pageTitle
  "text-2xl font-semibold text-neutral-900 dark:text-neutral-100" = $pageTitle
  "text-2xl font-semibold text-neutral-900 dark:text-neutral-50" = $pageTitle
  "mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "mt-1 $kpiValue"
  "mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "mt-2 $kpiValue"
  "mt-2 font-mono text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100" = "mt-2 $kpiValue"
  "font-mono text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50" = $kpiValue
  "font-mono text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = $kpiValue
  "font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50" = $kpiValue
  "font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = $kpiValue
  "m-0 mt-2 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "m-0 mt-2 $kpiValue"
  "m-0 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "m-0 $kpiValue"
  "mt-0 text-lg font-medium text-neutral-900 dark:text-neutral-100" = "mt-0 $sectionTitle"
  "mb-3 text-lg font-medium text-neutral-900 dark:text-neutral-100" = "mb-3 $sectionTitle"
  "text-lg font-medium text-neutral-900 dark:text-neutral-100" = $sectionTitle
  "m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100" = "m-0 $cardTitle"
  "mt-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100" = "mt-0 $cardTitle"
  "text-lg font-semibold text-neutral-900 dark:text-neutral-100" = $cardTitle
  "text-base font-semibold text-neutral-900 dark:text-neutral-100" = $cardTitle
  "text-base font-semibold text-neutral-900 dark:text-neutral-50" = $cardTitle
  "m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100" = "m-0 $cardTitle"
  "text-base font-semibold" = $cardTitle
  "text-lg font-semibold" = $cardTitle
  "text-lg font-semibold text-neutral-900 dark:text-neutral-50" = $sectionTitle
  "m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50" = "m-0 $sectionTitle"
  "mt-0 text-lg font-semibold" = "mt-0 $cardTitle"
  "mb-4 text-lg font-semibold" = "mb-4 $cardTitle"
  "text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "text-sm font-semibold tabular-nums text-al-text-primary"
  "mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100" = "mt-1 text-sm font-semibold tabular-nums text-al-text-primary"
  "mt-1 text-lg font-semibold tabular-nums text-teal-950 dark:text-teal-50" = "mt-1 text-sm font-semibold tabular-nums text-al-text-primary"
}

$changedFiles = 0
$totalReplacements = 0

foreach ($root in $roots) {

  if (-not (Test-Path -LiteralPath $root)) {
    continue
  }

  Get-ChildItem -LiteralPath $root -Recurse -Include *.tsx, *.ts -File |
    Where-Object { $_.FullName -notmatch '\\__snapshots__\\' } |
    ForEach-Object {
      $path = $_.FullName
      $content = [System.IO.File]::ReadAllText($path)
      $updated = $content
      $fileHits = 0

      foreach ($key in $replacements.Keys) {
        $value = $replacements[$key]
        $count = ([regex]::Matches($updated, [regex]::Escape($key))).Count

        if ($count -gt 0) {
          $updated = $updated.Replace($key, $value)
          $fileHits += $count
        }
      }

      if ($fileHits -gt 0) {
        [System.IO.File]::WriteAllText($path, $updated)
        $changedFiles++
        $totalReplacements += $fileHits
        Write-Host ("{0} ({1})" -f $path.Replace($uiRoot + '\', ''), $fileHits)
      }
    }
}

Write-Host ""
Write-Host ("TB-119 typography migration: {0} files, {1} replacements." -f $changedFiles, $totalReplacements)
