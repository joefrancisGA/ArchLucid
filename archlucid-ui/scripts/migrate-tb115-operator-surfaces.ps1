# TB-115: replace decorative pastel operator surfaces with neutral / semantic tokens (class strings only).
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uiRoot = Join-Path (Split-Path $PSScriptRoot -Parent) "src"
$roots = @(
  (Join-Path $uiRoot "app\(operator)"),
  (Join-Path $uiRoot "app\(executive)"),
  (Join-Path $uiRoot "components")
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
  "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" =
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
  "? `"border-teal-600 bg-teal-50/95 ring-2 ring-teal-500/30 dark:border-teal-500 dark:bg-teal-950/55`"" =
    "? `"border-neutral-400 bg-[var(--al-layer-hover)] ring-2 ring-[var(--al-accent-border-focus)]/30 dark:border-neutral-500 dark:bg-neutral-800/80`""
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
  "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30" =
    "border-rose-600/40 bg-al-surface-raised dark:border-rose-800/50"
  'isCurrent ? "bg-blue-50 dark:bg-blue-950/30" : ""' =
    'isCurrent ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80" : ""'
}

$changed = 0
$files = @()

foreach ($root in $roots) {
  if (-not (Test-Path -LiteralPath $root)) {
    continue
  }

  $files += Get-ChildItem -LiteralPath $root -Recurse -Include *.tsx, *.ts -File |
    Where-Object {
      $_.FullName -notmatch '\\marketing\\' -and
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
