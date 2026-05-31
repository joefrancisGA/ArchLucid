# TB-115: replace decorative pastel operator surfaces with neutral / semantic tokens (class strings only).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$roots = @(
  (Join-Path $uiRoot "app\(operator)"),
  (Join-Path $uiRoot "app\(executive)"),
  (Join-Path $uiRoot "app\(marketing)"),
  (Join-Path $uiRoot "app"),
  (Join-Path $uiRoot "components"),
  (Join-Path $uiRoot "lib")
)

$navActive =
  "border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] font-semibold text-al-text-primary dark:bg-neutral-800/80"

$neutralCard = "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
$rowHover =
  "transition-colors hover:border-neutral-300 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80"
$warnCallout =
  "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50"
$blockedCallout =
  "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50"
$successCallout =
  "rounded-md border border-emerald-700/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-emerald-800/50"
$interactiveChip =
  "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
$currentStepHighlight =
  "rounded-md border-l-2 border-l-[var(--al-accent-interactive)] bg-[var(--al-layer-hover)] pl-2 dark:bg-neutral-800/80"

$replacements = [ordered]@{
  "cursor-pointer border border-neutral-200 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50/30 dark:border-neutral-800 dark:hover:border-teal-800 dark:hover:bg-teal-950/20" =
    "cursor-pointer border border-neutral-200 shadow-sm $rowHover"
  "rounded-xl border-2 border-teal-600/60 bg-teal-50/55 p-4 shadow-sm dark:border-teal-500/40 dark:bg-teal-950/30" =
    "$neutralCard p-4 shadow-sm"
  "border-2 border-teal-700/80 text-neutral-900 shadow-sm hover:bg-teal-50 dark:border-teal-500/70 dark:text-neutral-50 dark:hover:bg-teal-950/40" =
    "border-2 border-neutral-400 text-neutral-900 shadow-sm hover:bg-[var(--al-layer-hover)] dark:border-neutral-600 dark:text-neutral-50 dark:hover:bg-neutral-800/80"
  "rounded-md border border-teal-200 bg-teal-50/70 px-3 py-2.5 dark:border-teal-800 dark:bg-teal-950/40" =
    "$neutralCard px-3 py-2.5"
  "inline-flex rounded-full border border-teal-200 bg-white px-2 py-0.5 text-xs font-medium text-teal-800 no-underline hover:bg-teal-50 dark:border-teal-700 dark:bg-neutral-900 dark:text-teal-300 dark:hover:bg-teal-950/60" =
    $interactiveChip
  "m-0 mb-2 rounded border border-teal-200/80 bg-teal-50/80 px-2 py-1.5 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100" =
    "m-0 mb-2 $successCallout px-2 py-1.5 text-xs"
  "rounded-md border-l-2 border-l-teal-600 bg-teal-50/25 pl-2 dark:border-l-teal-400 dark:bg-teal-950/20" =
    $currentStepHighlight
  "rounded-md border border-teal-200/80 bg-teal-50/60 px-3 py-2 text-sm text-neutral-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-neutral-200" =
    "$neutralCard px-3 py-2 text-sm"
  "rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 py-2 text-sm text-neutral-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-neutral-200" =
    "$neutralCard px-3 py-2 text-sm"
  "rounded-lg border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-50" =
    "$neutralCard p-4 text-sm"
  "rounded-md border border-teal-200 bg-white/80 p-2 dark:border-teal-900 dark:bg-neutral-950/40" =
    "$neutralCard p-2"
  "m-0 mt-2 inline-flex max-w-3xl flex-wrap items-center gap-2 rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100" =
    "m-0 mt-2 inline-flex max-w-3xl flex-wrap items-center gap-2 $neutralCard px-3 py-2 text-sm font-medium"
  "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    $warnCallout
  "rounded-md border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" =
    $warnCallout
  "rounded-md border border-amber-300/90 bg-amber-50/95 p-4 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout p-4 shadow-sm"
  "rounded-md border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" =
    $warnCallout
  "rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40" =
    "$warnCallout p-4"
  "rounded-lg border border-red-300 bg-red-50 shadow-sm dark:border-red-800 dark:bg-red-950/30" =
    "$blockedCallout shadow-sm"
  "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100" =
    $blockedCallout
  "rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" =
    "$blockedCallout p-4"
  "flex items-center rounded bg-red-50 p-2 text-sm text-red-600" =
    "flex items-center $blockedCallout p-2"
  "space-y-2 rounded bg-amber-50 p-2 text-sm text-amber-950" =
    "space-y-2 $warnCallout p-2"
  "flex items-start gap-2 rounded bg-green-50 p-2 text-sm text-green-800" =
    "flex items-start gap-2 $successCallout p-2"
  "border-teal-200 bg-teal-50/30 dark:border-teal-900 dark:bg-teal-950/20" =
    "border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "border-teal-200/70 shadow-sm dark:border-teal-900/45 lg:col-span-2" =
    "border-neutral-200 shadow-sm dark:border-neutral-800 lg:col-span-2"
  "rounded-lg border border-teal-200/90 bg-teal-50/50 p-3 dark:border-teal-900 dark:bg-teal-950/25" =
    "$neutralCard p-3"
  "rounded-lg border border-neutral-200/90 bg-teal-50/40 p-3 dark:border-neutral-700 dark:bg-teal-950/20" =
    "$neutralCard p-3"
  "rounded-md border border-teal-200/90 bg-teal-50/40 p-3 dark:border-teal-900/60 dark:bg-teal-950/30" =
    "$neutralCard p-3"
  "rounded-lg border border-teal-700/30 bg-teal-50/90 px-4 py-3 text-sm text-teal-950 shadow-sm dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-50" =
    "$neutralCard px-4 py-3 text-sm shadow-sm"
  "border border-teal-200/80 bg-white/90 shadow-sm dark:border-teal-900/50 dark:bg-neutral-950/80" =
    "border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800"
  "mb-6 border-teal-200 bg-teal-50/80 dark:border-teal-900 dark:bg-teal-950/40" =
    "mb-6 border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "mb-6 border-teal-200/90 bg-white dark:border-teal-900/50 dark:bg-neutral-950/40" =
    "mb-6 border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "m-0 rounded-md border border-teal-200/80 bg-teal-50/70 px-3 py-2 text-sm text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-50" =
    "m-0 $neutralCard px-3 py-2 text-sm"
  "w-full border-teal-700 text-teal-900 hover:bg-teal-50 dark:border-teal-600 dark:text-teal-100 dark:hover:bg-teal-950/50" =
    "w-full border-neutral-400 text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
  "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100" =
    "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700"
  "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100" =
    "border-rose-700/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100" =
    "border-emerald-700/40 bg-al-surface-raised text-al-text-primary dark:border-emerald-800/50"
  "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100" =
    "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30" =
    "border-rose-600/40 bg-al-surface-raised dark:border-rose-800/50"
  "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-900/30 dark:text-teal-200" = $navActive
  "flex flex-col gap-0.5 border-l-2 border-teal-200 py-1 pl-2 dark:border-teal-900/60" =
    "flex flex-col gap-0.5 border-l-2 border-neutral-200 py-1 pl-2 dark:border-neutral-800"
  "rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-950 dark:border-teal-700 dark:bg-teal-950/55 dark:text-teal-100" =
    "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-[11px] font-medium text-al-text-primary dark:border-neutral-600"
  "rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-950 dark:border-teal-700 dark:bg-teal-950/55 dark:text-teal-100" =
    "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary dark:border-neutral-600"
  "mb-3 max-w-prose rounded-md border border-teal-200/70 bg-teal-50/50 px-3 py-3 text-sm text-neutral-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-neutral-100" =
    "$neutralCard mb-3 max-w-prose px-3 py-3 text-sm"
  "mb-4 max-w-prose rounded-xl border-2 border-teal-600/70 bg-teal-50/70 px-4 py-3 text-sm font-semibold leading-snug text-neutral-950 shadow-sm dark:border-teal-500/50 dark:bg-teal-950/40 dark:text-neutral-50" =
    "$neutralCard mb-4 max-w-prose px-4 py-3 text-sm font-semibold leading-snug shadow-sm"
  "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100" =
    "$successCallout border"
  "border border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100" =
    "$blockedCallout border"
  "rounded-md border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/30" =
    "$neutralCard p-3"
  "sm:col-span-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout sm:col-span-3 px-3 py-2 text-xs"
  "rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40" =
    "$warnCallout p-3"
  "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100" =
    "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
  "mb-2 rounded-md border border-teal-200/80 bg-teal-50/70 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-900 dark:bg-teal-950/35 dark:text-teal-50" =
    "$neutralCard mb-2 px-3 py-2 text-sm font-medium"
  "rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-neutral-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50" =
    "$neutralCard px-3 py-2 text-sm"
  "rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-left text-sm shadow-sm transition hover:border-teal-400 hover:bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40 dark:hover:border-teal-700" =
    "$neutralCard p-4 text-left text-sm shadow-sm transition hover:border-neutral-400 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-600"
  "mb-6 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100" =
    "$neutralCard mb-6 px-4 py-3 text-sm leading-relaxed"
  "mb-4 max-w-3xl rounded-lg border border-teal-200/80 bg-teal-50/55 p-4 dark:border-teal-900/50 dark:bg-teal-950/30" =
    "$neutralCard mb-4 max-w-3xl p-4"
  "border border-teal-300 bg-teal-50/80 font-semibold dark:border-teal-700 dark:bg-teal-950/40" =
    "border border-neutral-300 bg-[var(--al-layer-hover)] font-semibold dark:border-neutral-600 dark:bg-neutral-800/80"
  "rounded-lg border border-amber-200/90 bg-amber-50/80 p-3 dark:border-amber-900/60 dark:bg-amber-950/25" =
    "$warnCallout p-3"
  "rounded-xl border-2 border-teal-600/70 bg-teal-50/60 p-4 shadow-sm dark:border-teal-500/40 dark:bg-teal-950/35" =
    "$neutralCard p-4 shadow-sm"
  "border border-blue-200/80 bg-blue-50/50 shadow-sm dark:border-blue-950/60 dark:bg-blue-950/25" =
    "border border-neutral-200 bg-al-surface-raised shadow-sm dark:border-neutral-800"
  "rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20" =
    "$warnCallout p-4"
  "rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/60 dark:bg-teal-950/20" =
    "$neutralCard p-4"
  "rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900/60 dark:bg-sky-950/20" =
    "$neutralCard p-4"
  "rounded-lg border border-teal-200/90 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30" =
    "$neutralCard p-4"
  "border-2 border-teal-200/90 bg-teal-50/40 dark:border-teal-900/60 dark:bg-teal-950/30" =
    "border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "mb-3 max-w-prose rounded-md border border-teal-100 bg-teal-50/70 px-3 py-2 text-sm text-neutral-900 dark:border-teal-900/45 dark:bg-teal-950/35 dark:text-neutral-100" =
    "$neutralCard mb-3 max-w-prose px-3 py-2 text-sm"
  "rounded-lg border border-rose-300/90 bg-rose-50/95 px-4 py-3 text-sm text-rose-950 shadow-sm dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-50" =
    "$blockedCallout px-4 py-3 text-sm shadow-sm"
  "rounded-lg border border-amber-300/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout px-4 py-3 text-sm shadow-sm"
  "m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "m-0 $warnCallout px-3 py-2 text-xs"
  "mt-4 max-w-prose rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm leading-snug text-neutral-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-neutral-200" =
    "$warnCallout mt-4 max-w-prose px-3 py-2 text-sm leading-snug"
  "space-y-3 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40" =
    "$neutralCard space-y-3 p-4"
  "rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-4 py-3 text-sm"
  "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout p-3 text-sm"
  "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-sm"
  "rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-neutral-900 dark:border-amber-900/55 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-xs"
  "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout px-3 py-2 text-sm"
  "flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100" =
    "$warnCallout flex flex-col gap-3 px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-start sm:justify-between"
  "shrink-0 self-end border-amber-400 bg-white text-amber-950 hover:bg-amber-100 sm:self-start dark:border-amber-700 dark:bg-transparent dark:text-amber-50 dark:hover:bg-amber-900/60" =
    "shrink-0 self-end border-neutral-400 bg-al-surface-raised text-al-text-primary hover:bg-[var(--al-layer-hover)] sm:self-start dark:border-neutral-600"
  "rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40" =
    "$neutralCard px-4 py-3"
  "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" =
    "inline-flex rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-emerald-800/50"
  "rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300" =
    "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600"
  "bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-50" =
    "bg-al-surface-raised text-al-text-primary dark:bg-neutral-900/50"
  "bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50" =
    "bg-al-surface-raised text-al-text-primary dark:bg-neutral-900/50"
  "ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-950 dark:text-amber-200" =
    "ml-1 rounded border border-amber-600/40 bg-al-surface-raised px-1.5 py-0.5 text-[10px] font-semibold uppercase text-al-text-primary dark:border-amber-700/50"
  "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50" =
    "border-rose-600/40 text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-rose-800/50"
  "w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50" =
    "w-full border-rose-600/40 text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-rose-800/50"
  "border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/20" =
    "border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "border-teal-200/80 bg-teal-50/30 dark:border-teal-900 dark:bg-teal-950/20" =
    "border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "mb-8 border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/25" =
    "mb-8 border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "border-teal-600 bg-teal-50/95 ring-2 ring-teal-500/30 dark:border-teal-500 dark:bg-teal-950/55" =
    "border-neutral-400 bg-[var(--al-layer-hover)] ring-2 ring-[var(--al-accent-border-focus)]/30 dark:border-neutral-500 dark:bg-neutral-800/80"
  "rounded-md border border-teal-300 bg-teal-50 px-4 py-3 dark:border-teal-700 dark:bg-teal-950/40" =
    "$neutralCard px-4 py-3"
  "rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout px-3 py-2 text-sm"
  "mt-3 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout mt-3 px-3 py-2 text-sm"
  "rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300" =
    "$warnCallout px-3 py-2.5 text-sm"
  "mb-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300" =
    "$warnCallout mb-3 px-3 py-2.5 text-sm"
  "rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-50" =
    "$blockedCallout p-4 text-sm"
  "rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout p-4 text-sm"
  "rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/30" =
    "$neutralCard px-4 py-3"
  "rounded-lg border border-teal-200/90 bg-teal-50/55 p-4 dark:border-teal-900/50 dark:bg-teal-950/35" =
    "$neutralCard p-4"
  "rounded-lg border border-teal-200/80 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/30" =
    "$neutralCard p-4"
  "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100" =
    "inline-flex items-center rounded-full border border-emerald-700/40 bg-al-surface-raised px-2.5 py-0.5 text-xs font-medium text-al-text-primary dark:border-emerald-800/50"
  "inline-flex shrink-0 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200" =
    "inline-flex shrink-0 rounded border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-al-text-primary dark:border-neutral-600"
  "space-y-2 rounded-lg border border-teal-200 bg-teal-50/40 p-3 dark:border-teal-800 dark:bg-teal-950/30" =
    "$neutralCard space-y-2 p-3"
  "rounded-md border border-amber-200/85 bg-amber-50/80 px-2.5 py-1 text-xs leading-snug text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" =
    "$warnCallout px-2.5 py-1 text-xs leading-snug"
  "rounded-md border border-teal-200/80 bg-teal-50/60 px-2.5 py-1 text-xs leading-snug text-teal-950 dark:border-teal-900/55 dark:bg-teal-950/30 dark:text-teal-50" =
    "$neutralCard px-2.5 py-1 text-xs leading-snug"
  "mb-4 max-w-prose rounded-md border border-teal-200 bg-teal-50/90 px-3 py-2 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100" =
    "$neutralCard mb-4 max-w-prose px-3 py-2 text-sm"
  "max-w-prose rounded-md border border-teal-200/90 bg-teal-50/60 px-3 py-2.5 text-sm leading-snug text-neutral-800 dark:border-teal-900/70 dark:bg-teal-950/25 dark:text-neutral-200" =
    "$neutralCard max-w-prose px-3 py-2.5 text-sm leading-snug"
  "rounded-xl border border-teal-200 bg-white p-4 shadow-sm dark:border-teal-900 dark:bg-neutral-950" =
    "$neutralCard p-4 shadow-sm"
  "rounded-xl border-2 border-teal-300 bg-white p-4 shadow-md ring-1 ring-teal-100 dark:border-teal-800 dark:bg-neutral-950 dark:ring-teal-950/40" =
    "$neutralCard border-2 p-4 shadow-md ring-1 ring-neutral-200 dark:ring-neutral-800"
  "inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300" =
    "inline-flex items-center rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600"
  'isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : ""' =
    'isCurrent ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : ""'
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40" =
    "$warnCallout px-4 py-3 text-sm"
  "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100" =
    "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700"
  "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "rounded-lg border border-amber-300/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-sm"
  "rounded-xl border-2 border-teal-600/75 bg-teal-50/70 px-4 py-3 shadow-sm dark:border-teal-500/60 dark:bg-teal-950/35" =
    "$neutralCard px-4 py-3 shadow-sm"
  "m-0 rounded-lg border border-teal-200/80 bg-teal-50/60 px-3 py-2 text-sm font-medium leading-snug text-neutral-900 dark:border-teal-900/55 dark:bg-teal-950/30 dark:text-neutral-100" =
    "m-0 $neutralCard px-3 py-2 text-sm font-medium leading-snug"
  "rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950 shadow-sm dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout p-3 text-sm shadow-sm"
  "space-y-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-4 dark:border-teal-900 dark:bg-teal-950/30" =
    "$neutralCard space-y-4 px-4 py-4"
  "border-teal-600 bg-teal-50/70 dark:border-teal-500 dark:bg-teal-950/30" =
    "border-neutral-400 bg-al-surface-raised dark:border-neutral-600"
  "rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40" =
    "$warnCallout p-4"
  "rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100" =
    "$successCallout p-3 text-sm"
  "rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100" =
    "$blockedCallout p-3 text-sm"
  "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout p-3 text-sm"
  "rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout p-4"
  "rounded-lg border border-red-200 bg-red-50/90 p-5 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-50" =
    "$blockedCallout p-5"
  "mt-4 rounded-md border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-50" =
    "$neutralCard mt-4 p-4 text-sm"
  "mt-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout mt-2 px-3 py-2 text-sm"
  "rounded-md border border-amber-200/85 bg-amber-50/75 px-2.5 py-2 text-sm leading-snug text-neutral-800 dark:border-amber-900/55 dark:bg-amber-950/35 dark:text-neutral-200" =
    "$warnCallout px-2.5 py-2 text-sm leading-snug"
  "rounded-lg border border-teal-200/70 bg-teal-50/40 p-3 dark:border-teal-800/50 dark:bg-teal-950/20" =
    "$neutralCard p-3"
  "bg-teal-50 dark:bg-teal-900/20" =
    "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80"
  "rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/30" =
    "$neutralCard px-4 py-3"
  "rounded-lg border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900 dark:bg-violet-950/30" =
    "$neutralCard p-4"
  "mb-6 rounded-md border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-neutral-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-neutral-50" =
    "$neutralCard mb-6 px-4 py-3 text-sm"
  "rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-left text-sm shadow-sm transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40 dark:hover:border-violet-700" =
    "$neutralCard p-4 text-left text-sm shadow-sm transition hover:border-neutral-400 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-600"
  "rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-950 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100" =
    "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-[11px] font-medium text-al-text-primary dark:border-neutral-600"
  "space-y-3 rounded-xl border-2 border-violet-400/40 bg-violet-50/40 p-5 dark:border-violet-800/40 dark:bg-violet-950/20" =
    "$neutralCard space-y-3 border-2 p-5"
  "rounded-lg border border-dashed border-violet-300 bg-violet-50/60 p-4 dark:border-violet-800 dark:bg-violet-950/30" =
    "rounded-md border border-dashed border-neutral-300 bg-al-surface-raised p-4 dark:border-neutral-700"
  "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100" =
    "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700"
  "space-y-2 rounded-md border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-900 dark:bg-violet-950/30" =
    "$neutralCard space-y-2 p-3"
  "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-sky-400 bg-sky-50 p-3 text-sm text-sky-950 shadow-sm dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-50" =
    "$neutralCard mb-4 flex flex-wrap items-start justify-between gap-3 p-3 text-sm shadow-sm"
  "border-sky-200/90 bg-sky-50/90 dark:border-sky-800/80 dark:bg-sky-950/35" =
    "border-neutral-200/90 bg-al-surface-raised dark:border-neutral-800/80"
  "rounded-md border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30" =
    "$neutralCard p-3"
  "mt-6 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-4 dark:border-blue-950 dark:bg-blue-950/35" =
    "$neutralCard mt-6 px-4 py-4"
  "m-0 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm leading-relaxed text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-50" =
    "$warnCallout p-3 leading-relaxed"
  "m-0 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm leading-relaxed text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-50" =
    "$warnCallout p-3 leading-relaxed"
  "mt-2 rounded-md border border-yellow-500 bg-yellow-50 px-3 py-2 text-sm text-yellow-950 dark:border-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-50" =
    "$warnCallout mt-2 px-3 py-2 text-sm"
  "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" =
    "$blockedCallout px-3 py-2 text-sm"
  "rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100" =
    "$blockedCallout p-2 text-sm"
  'role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-2 text-sm text-rose-900"' =
    'role="alert" className="rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-sm text-al-text-primary dark:border-rose-800/50"'
  "space-y-3 rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40" =
    "$neutralCard space-y-3 p-4"
  "mt-10 max-w-3xl rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/30" =
    "$neutralCard mt-10 max-w-3xl p-4"
  "mb-4 flex flex-col gap-2 rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-sm text-neutral-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-neutral-100 sm:flex-row sm:items-start sm:justify-between" =
    "$neutralCard mb-4 flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-start sm:justify-between"
  "mt-3 rounded bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900 dark:bg-teal-950/40 dark:text-teal-100" =
    "$neutralCard mt-3 px-3 py-2 text-sm font-medium"
  "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100" =
    "$blockedCallout p-4 text-sm"
  "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-red-400 bg-red-50 p-3 text-sm text-red-950 shadow-sm dark:border-red-700 dark:bg-red-950/50 dark:text-red-50" =
    "$blockedCallout mb-4 flex flex-wrap items-start justify-between gap-3 p-3 text-sm shadow-sm"
  "rounded-md border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-50" =
    "$warnCallout p-3 text-xs"
  "rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout p-2 text-xs"
  "mt-2 max-h-64 overflow-auto rounded-md border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-50" =
    "mt-2 max-h-64 overflow-auto $warnCallout p-3 text-xs"
  "bg-amber-50 ring-2 ring-amber-400 ring-inset dark:bg-amber-950/30 dark:ring-amber-600" =
    "bg-[var(--al-layer-hover)] ring-2 ring-amber-600/50 ring-inset dark:bg-neutral-800/80 dark:ring-amber-700/50"
  "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-50" =
    "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "rounded-md bg-teal-50 px-2 py-1 font-semibold text-teal-900 underline decoration-teal-700 decoration-2 underline-offset-2 dark:bg-teal-900/30 dark:text-teal-200" =
    "rounded-md bg-[var(--al-layer-hover)] px-2 py-1 font-semibold text-al-text-primary underline decoration-[var(--al-accent-interactive)] decoration-2 underline-offset-2 dark:bg-neutral-800/80"
  "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-50" =
    "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
  "rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 py-3 dark:border-teal-900/60 dark:bg-teal-950/25" =
    "$neutralCard px-3 py-3"
  "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100" =
    "border-neutral-400 bg-[var(--al-layer-hover)] text-al-text-primary dark:border-neutral-500 dark:bg-neutral-800/80"
  "rounded-lg border border-teal-200/80 bg-teal-50/40 p-3 dark:border-teal-900 dark:bg-teal-950/25" =
    "$neutralCard p-3"
  "border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20" =
    "border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "border-teal-300 bg-teal-50/30 shadow-md ring-1 ring-teal-500/20 hover:shadow-lg dark:border-teal-700/60 dark:bg-teal-900/20 dark:ring-teal-500/20" =
    "border-neutral-300 bg-al-surface-raised shadow-md ring-1 ring-[var(--al-accent-border-focus)]/20 hover:shadow-lg dark:border-neutral-600 dark:bg-neutral-800/80"
  "rounded-lg border border-teal-200/90 bg-teal-50/50 px-4 py-3 text-left dark:border-teal-900/70 dark:bg-teal-950/35" =
    "$neutralCard px-4 py-3 text-left"
  "mb-4 rounded-lg border border-red-400 bg-red-50 p-3 text-sm text-red-950 shadow-sm dark:border-red-700 dark:bg-red-950/50 dark:text-red-50" =
    "$blockedCallout mb-4 p-3 text-sm shadow-sm"
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2 py-0 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300" =
    "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-amber-600/40 bg-al-surface-raised px-2 py-0 text-[11px] font-semibold text-al-text-primary dark:border-amber-700/50"
  "w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-neutral-600 dark:text-teal-200 dark:hover:bg-teal-950/30" =
    "w-full rounded-md border border-dashed border-neutral-200 py-1.5 text-left text-xs font-semibold text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
  "border border-red-800 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100" =
    "border border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "border border-violet-600 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100" =
    "border border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600"
  "border border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50" =
    "border border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "border-amber-500/70 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-600/60 dark:bg-amber-950/50 dark:text-amber-50" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary shadow-sm dark:border-amber-700/50"
  "border-blue-500/70 bg-blue-50 text-blue-950 dark:border-blue-600/60 dark:bg-blue-950/40 dark:text-blue-100" =
    "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600"
  "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100" =
    "border-emerald-700/40 bg-al-surface-raised text-al-text-primary dark:border-emerald-800/50"
  "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100" =
    "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-100" =
    "inline-flex rounded-md border border-neutral-300 bg-al-surface-raised px-2 py-1 text-xs font-semibold text-al-text-primary dark:border-neutral-600"
  "mt-6 rounded-lg border border-neutral-200 bg-teal-50/60 p-4 dark:border-neutral-700 dark:bg-teal-950/30" =
    "$neutralCard mt-6 p-4"
  "mt-6 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100" =
    "$neutralCard mt-6 p-4 text-sm"
  "mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout mt-6 p-4 text-sm"
  "rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" =
    "$warnCallout px-3 py-2 text-xs"
  "rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50" =
    "$neutralCard p-4 text-sm"
  "mt-3 rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-50" =
    "$neutralCard mt-3 p-4 text-sm"
  "mx-auto flex size-12 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200 sm:size-14" =
    "mx-auto flex size-12 items-center justify-center rounded-full border border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 sm:size-14"
  "rounded-lg border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20" =
    "$warnCallout p-5"
  "rounded-lg border border-teal-200/80 bg-teal-50/40 p-5 dark:border-teal-900/50 dark:bg-teal-950/25" =
    "$neutralCard p-5"
  "mt-8 rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40" =
    "$neutralCard mt-8 px-4 py-3"
  "mt-6 rounded-xl border-2 border-emerald-400 bg-emerald-50/90 px-5 py-5 shadow-md dark:border-emerald-700 dark:bg-emerald-950/50" =
    "$neutralCard mt-6 border-2 px-5 py-5 shadow-md"
  "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30" =
    "border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-sm"
  "mt-4 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40" =
    "$blockedCallout mt-4 max-w-lg px-4 py-3"
  "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100" =
    "$blockedCallout p-3 text-sm"
  "rounded-full border border-sky-600 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100" =
    "inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-3 py-1 text-xs font-medium text-al-text-primary dark:border-neutral-600"
  'isActive ? "bg-blue-50 dark:bg-blue-950/30" : ""' =
    'isActive ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : ""'
  "border-teal-700 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100" =
    "border-neutral-400 bg-[var(--al-layer-hover)] text-al-text-primary dark:bg-neutral-800/80"
  '${cardBaseCls} border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' =
    '${cardBaseCls} border-emerald-700/40 bg-al-surface-raised text-al-text-primary dark:border-emerald-800/50'
  '${cardBaseCls} border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200' =
    '${cardBaseCls} border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50'
  '${cardBaseCls} border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200' =
    '${cardBaseCls} border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50'
  "border-r-[3px] border-neutral-300 bg-amber-50 dark:border-neutral-600 dark:bg-amber-950/40" =
    "border-r-[3px] border-neutral-300 bg-al-surface-raised dark:border-neutral-600"
  "bg-green-50 dark:bg-green-950/40" =
    "bg-al-surface-raised dark:bg-neutral-900/50"
  "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50"
  "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100" =
    "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
  "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout mb-4 flex flex-wrap items-start justify-between gap-3 p-3 text-sm"
  "rounded-md border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout p-3 text-xs"
  "rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40" =
    "$warnCallout p-3"
  "px-3.5 py-3 border border-indigo-200 bg-indigo-50 rounded-lg mb-[18px] text-sm leading-relaxed dark:border-indigo-900 dark:bg-indigo-950/40" =
    "$neutralCard px-3.5 py-3 mb-[18px] text-sm leading-relaxed"
  "bg-amber-50 dark:bg-amber-950/40 px-1.5 py-px" =
    "bg-al-surface-raised dark:bg-neutral-800/80 px-1.5 py-px"
  "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100" =
    "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700"
  "rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/40" =
    "$warnCallout p-3 text-sm"
  "rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/55 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-xs"
  "flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-300/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout flex flex-wrap items-start justify-between gap-3 px-3 py-2 text-sm"
  "mb-3 max-w-3xl rounded-md border border-teal-200/80 bg-teal-50/50 p-3 text-sm text-neutral-900 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-neutral-100" =
    "$neutralCard mb-3 max-w-3xl p-3 text-sm"
  "m-0 rounded-md border border-amber-200 bg-amber-50/90 p-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100" =
    "$warnCallout m-0 p-2 text-sm"
  "mt-6 rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40" =
    "$neutralCard mt-6 p-4"
  "rounded-lg border border-teal-200/80 bg-teal-50/60 p-4 shadow-sm dark:border-teal-900/40 dark:bg-teal-950/40" =
    "$neutralCard p-4 shadow-sm"
  "border border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30" =
    "border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100" =
    "$blockedCallout mt-3 p-3 text-sm"
  "rounded-lg border border-amber-300/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout px-3 py-2 text-sm"
  "border-teal-700 bg-teal-50 text-teal-950 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-50" =
    "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-500 dark:bg-neutral-800/80"
  "m-0 rounded-md border border-amber-200 bg-amber-50/90 p-3 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50" =
    "$warnCallout m-0 p-3"
  "rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-neutral-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50" =
    "$neutralCard px-3 py-2 text-sm"
  "flex flex-wrap items-center gap-2 rounded-md border border-teal-200/80 bg-teal-50/50 px-3 py-2 text-sm dark:border-teal-900/60 dark:bg-teal-950/25" =
    "$neutralCard flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
  "rounded-lg border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/35" =
    "$warnCallout p-4 shadow-sm"
  "mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
    "$warnCallout mb-4 px-4 py-3 text-sm"
  "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" =
    "$blockedCallout p-3 text-sm"
  "inline-flex items-center justify-center rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-medium text-teal-900 no-underline hover:bg-teal-50 dark:border-teal-500/70 dark:bg-neutral-900 dark:text-teal-100 dark:hover:bg-teal-950/60" =
    "inline-flex items-center justify-center rounded-md border border-neutral-400 bg-al-surface-raised px-3 py-2 text-sm font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
  "flex cursor-pointer flex-col items-start gap-1 rounded-md border border-transparent px-3 py-2.5 aria-selected:border-teal-200 aria-selected:bg-teal-50 dark:aria-selected:border-teal-900 dark:aria-selected:bg-teal-950/40" =
    "flex cursor-pointer flex-col items-start gap-1 rounded-md border border-transparent px-3 py-2.5 aria-selected:border-neutral-400 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
  "border border-teal-200/80 bg-teal-50/50 dark:border-teal-900/55 dark:bg-teal-950/35" =
    "border border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "mb-6 max-w-4xl rounded-lg border-2 border-dashed border-teal-400/85 bg-teal-50/55 p-4 shadow-sm ring-1 ring-teal-300/40 dark:border-teal-600/70 dark:bg-teal-950/35 dark:ring-teal-800/45" =
    "mb-6 max-w-4xl rounded-lg border-2 border-dashed border-neutral-400 bg-al-surface-raised p-4 shadow-sm ring-1 ring-neutral-300/40 dark:border-neutral-600 dark:bg-neutral-900/50 dark:ring-neutral-700/45"
  "rounded-md border border-teal-200 bg-teal-50/80 px-2 py-1 font-medium text-teal-900 no-underline hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-950/80" =
    "rounded-md border border-neutral-300 bg-al-surface-raised px-2 py-1 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
  "rounded-md border border-amber-200 bg-amber-50/80 px-2 py-1 font-medium text-amber-950 no-underline hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70" =
    "rounded-md border border-amber-600/40 bg-al-surface-raised px-2 py-1 font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-amber-700/50"
  "mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100" =
    "$warnCallout mt-4 px-3 py-2 text-xs"
  "mt-4 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100" =
    "$neutralCard mt-4 px-3 py-2 text-xs"
  "flex flex-wrap items-center gap-3 py-2.5 px-3 mb-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm" =
    "$neutralCard flex flex-wrap items-center gap-3 py-2.5 px-3 mb-3 text-sm"
  "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100" =
    "$warnCallout p-3 text-sm"
  "mb-6 rounded-lg border border-teal-200/80 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/20" =
    "$neutralCard mb-6 p-4"
  "mb-6 border-teal-200/80 bg-teal-50/35 dark:border-teal-900/55 dark:bg-teal-950/20" =
    "mb-6 border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
  "m-0 max-w-prose rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-neutral-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-neutral-50" =
    "$warnCallout m-0 max-w-prose px-3 py-2 text-sm"
  "mt-6 max-w-xl space-y-3 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" =
    "$blockedCallout mt-6 max-w-xl space-y-3 p-4 text-sm"
}

$changed = 0
$files = @()

foreach ($root in $roots) {
  if (-not (Test-Path -LiteralPath $root)) {
    continue
  }

  $files += Get-ChildItem -LiteralPath $root -Recurse -Include *.tsx, *.ts -File |
    Where-Object {
      $_.FullName -notmatch '__snapshots__' -and
      $_.FullName -notmatch '\.test\.'
    }
}

foreach ($file in $files | Sort-Object -Property FullName -Unique) {
  $text = [System.IO.File]::ReadAllText($file.FullName)
  $original = $text

  foreach ($entry in $replacements.GetEnumerator()) {
    $text = $text.Replace($entry.Key, $entry.Value)
  }

  if ($text -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $text)
    $changed++
    Write-Host "Updated: $($file.FullName.Substring($uiRoot.Length + 1))"
  }
}

Write-Host "TB-115 migration: $changed file(s) updated."
