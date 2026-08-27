#!/usr/bin/env node
/**
 * One-shot codemod for TB-2092 broader operator teal demotion.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "src");

function walkTsFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
      continue;
    }

    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

const CLASSNAME_LITERAL_REPLACEMENTS = [
  [
    "mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20",
    "OPERATOR_RESUME.stripSpaced",
  ],
  [
    "mb-1 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20",
    "OPERATOR_RESUME.stripCompact",
  ],
  [
    "mb-3 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/20",
    "OPERATOR_RESUME.stripCelebrate",
  ],
  [
    "rounded-lg border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30",
    "OPERATOR_RESUME.stripPadded",
  ],
];

const INLINE_REPLACEMENTS = [
  [
    "sticky top-[calc(var(--app-shell-sticky,6rem)+0.5rem)] z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-teal-200 bg-teal-50/90 px-3 py-2 dark:border-teal-900 dark:bg-teal-950/40",
    "sticky top-[calc(var(--app-shell-sticky,6rem)+0.5rem)] z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "mx-2 mb-2 mt-1 rounded-md border border-teal-700/30 bg-teal-50/80 px-3 py-2 dark:border-teal-800/50 dark:bg-teal-950/30",
    "mx-2 mb-2 mt-1 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "flex flex-wrap items-center justify-between gap-2 rounded-md border border-teal-200/70 bg-teal-50/80 px-3 py-2 text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
    "flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "? \"border-teal-600 bg-teal-50/80 ring-1 ring-teal-600 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-500\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    "? \"border-teal-700 bg-neutral-50 ring-1 ring-teal-700 dark:border-teal-500 dark:bg-neutral-900/60 dark:ring-teal-500\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    "props.selectedDomain === row.normalizedDomain ? \"border-teal-700 bg-al-surface-raised\" : \"border-neutral-200\"",
    "props.selectedDomain === row.normalizedDomain ? OPERATOR_SELECTION.row : \"border-neutral-200\"",
  ],
  [
    "isNext ? \"bg-teal-50/60 dark:bg-teal-950/20\" : null",
    "isNext ? \"bg-neutral-50/80 dark:bg-neutral-900/40\" : null",
  ],
  [
    "isHighlightedNext ? \"rounded-md border-l-4 border-l-teal-600 bg-teal-50/40 pl-3 dark:border-l-teal-400 dark:bg-teal-950/20\" : null",
    "isHighlightedNext ? \"rounded-md border-l-4 border-l-neutral-700 bg-neutral-50/80 pl-3 dark:border-l-neutral-400 dark:bg-neutral-900/40\" : null",
  ],
  [
    "? \"border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200\"",
    "? \"border-neutral-300 bg-neutral-50 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100\"",
  ],
  [
    ": \"border-teal-200 text-teal-900 dark:border-teal-900 dark:text-teal-100\"",
    ": \"border-neutral-200 text-al-text-primary dark:border-neutral-700 dark:text-neutral-100\"",
  ],
  [
    "? \"border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100\"",
    "? \"border-neutral-200 bg-neutral-50 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100\"",
  ],
  [
    "rounded-md border border-teal-300/80 bg-teal-50/90 p-4 dark:border-teal-800 dark:bg-teal-950/30",
    "rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-lg border border-teal-200 bg-teal-50/70 shadow-sm dark:border-teal-900 dark:bg-teal-950/20",
    "rounded-lg border border-neutral-200 bg-neutral-50/80 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-3 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100",
    "rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100",
    "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "? \"border-teal-600 font-semibold text-al-text-primary dark:border-teal-400 dark:text-teal-300\"",
    "? \"border-neutral-600 font-semibold text-al-text-primary dark:border-neutral-400 dark:text-neutral-100\"",
  ],
  [
    "shrink-0 rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
    "shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "space-y-3 rounded-md border border-teal-700/25 bg-al-surface-raised p-3",
    "space-y-3 rounded-md border border-neutral-200 bg-al-surface-raised p-3",
  ],
  [
    "rounded-md border border-teal-700/30 bg-al-surface-raised p-3 dark:border-teal-600/40",
    "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700",
  ],
  [
    "m-0 mt-3 grid gap-2 border-t border-teal-200/80 pt-3 sm:grid-cols-3 dark:border-teal-900/70",
    "m-0 mt-3 grid gap-2 border-t border-neutral-200 pt-3 sm:grid-cols-3 dark:border-neutral-700",
  ],
  [
    "rounded-lg border border-teal-200 bg-teal-50/90 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/40",
    "rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "border border-teal-600/50 shadow-sm dark:border-teal-500/40",
    "border border-neutral-300 shadow-sm dark:border-neutral-600",
  ],
  [
    "flex flex-col border-teal-300/80 shadow-sm dark:border-teal-800/80",
    "flex flex-col border-neutral-300 shadow-sm dark:border-neutral-700",
  ],
  [
    "mt-2 rounded-md px-3 py-1.5 text-teal-900 underline decoration-teal-700/40 underline-offset-2 hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-teal-950/40",
    "mt-2 rounded-md px-3 py-1.5 text-al-text-primary underline decoration-neutral-400 underline-offset-2 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900/60",
  ],
  [
    "hover:border-teal-600/45 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-teal-500/40 dark:hover:bg-neutral-900/60",
    "hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40 dark:hover:border-neutral-500 dark:hover:bg-neutral-900/60",
  ],
  [
    "hover:border-teal-600/40 hover:shadow dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-400/40",
    "hover:border-neutral-400 hover:shadow dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-500",
  ],
  [
    "inline-flex h-auto max-w-full items-center rounded-md border border-teal-700/30 bg-white px-2.5 py-1.5 font-medium text-teal-900 no-underline hover:bg-teal-50 dark:border-teal-600/40 dark:bg-neutral-900 dark:text-teal-200 dark:hover:bg-neutral-800",
    "inline-flex h-auto max-w-full items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-medium text-al-text-primary no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
  ],
  [
    "rounded-md border border-teal-700/30 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-teal-800/40 dark:bg-neutral-900/60 dark:text-neutral-100",
    "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100",
  ],
  [
    "? \"bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200\"",
    "? \"bg-neutral-100 text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100\"",
  ],
  [
    "text-teal-900 dark:text-teal-100",
    "text-al-text-primary dark:text-neutral-100",
  ],
  [
    "text-teal-900 dark:text-teal-200",
    "text-al-text-primary dark:text-neutral-100",
  ],
  [
    "text-teal-900/90 dark:text-teal-100/90",
    "text-al-text-primary dark:text-neutral-100",
  ],
  [
    "text-teal-900/90 dark:text-teal-200/90",
    "text-al-text-secondary dark:text-neutral-200",
  ],
  [
    "rounded-md border border-teal-200/80 bg-white/70 dark:border-teal-900/60 dark:bg-teal-950/30",
    "rounded-md border border-neutral-200 bg-white/70 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "m-0 list-none space-y-3 border-t border-teal-200/60 px-3 py-3 dark:border-teal-800/50",
    "m-0 list-none space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-neutral-700",
  ],
  [
    "mb-6 rounded-lg border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/50 dark:bg-teal-950/20",
    "mb-6 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-lg border border-teal-300/80 bg-teal-50/90 dark:border-teal-800 dark:bg-teal-950/30",
    "rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-md border border-teal-700/25 bg-teal-50/40 px-3 py-3 dark:border-teal-600/30 dark:bg-teal-950/20",
    "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "space-y-2 rounded-md border border-teal-700/25 bg-teal-50/40 px-3 py-2 dark:border-teal-600/30 dark:bg-teal-950/20",
    "space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "mb-3 rounded-md border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/30",
    "mb-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "mb-3 max-w-3xl rounded-md border border-teal-200/80 bg-teal-50/60 px-3 py-2 text-al-text-primary dark:border-teal-900/50 dark:bg-teal-950/30",
    "mb-3 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-md border border-dashed border-teal-300 bg-teal-50/40 p-4 dark:border-teal-800 dark:bg-teal-950/20",
    "rounded-md border border-dashed border-neutral-300 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "mt-1 max-h-64 overflow-auto rounded-md border border-teal-600/40 bg-white p-3 dark:border-teal-700/50 dark:bg-neutral-950",
    "mt-1 max-h-64 overflow-auto rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-600 dark:bg-neutral-950",
  ],
  [
    "mb-4 rounded-md border border-teal-200/70 bg-teal-50/80 px-4 py-3 text-teal-950 print:hidden",
    "mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-al-text-primary print:hidden",
  ],
  [
    "border-b border-teal-200/70 bg-teal-50/80 px-4 py-1.5 text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
    "border-b border-neutral-200 bg-neutral-50/80 px-4 py-1.5 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "mt-6 rounded-lg border border-teal-200/80 bg-teal-50/30 p-4 print:hidden dark:border-teal-900/40 dark:bg-teal-950/20",
    "mt-6 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 print:hidden dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 font-medium text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-100",
    "inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-medium text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "? \"border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-100\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    "selectedPath === path && \"ring-2 ring-teal-700/40 ring-offset-2\"",
    "selectedPath === path && \"ring-2 ring-neutral-500/50 ring-offset-2\"",
  ],
  [
    "isFocused ? \"ring-2 ring-inset ring-teal-700/40 dark:ring-teal-400/40\" : undefined",
    "isFocused ? \"ring-2 ring-inset ring-neutral-500/40 dark:ring-neutral-400/40\" : undefined",
  ],
  [
    "? \"border-l-[3px] border-l-teal-700 border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:border-l-teal-500 dark:bg-neutral-950\"",
    "? \"border-l-[3px] border-l-neutral-700 border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:border-l-neutral-400 dark:bg-neutral-950\"",
  ],
  [
    "? \"mb-8 border-2 border-teal-600 shadow-xl ring-1 ring-teal-500/25 dark:border-teal-500\"",
    "? \"mb-8 border-2 border-neutral-400 shadow-xl ring-1 ring-neutral-400/25 dark:border-neutral-500\"",
  ],
  [
    "flex flex-col items-start gap-2 border-t border-teal-200/70 pt-4 dark:border-teal-900/60",
    "flex flex-col items-start gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700",
  ],
  [
    "border-teal-200/70 dark:border-teal-900/40",
    "border-neutral-200 dark:border-neutral-700",
  ],
  [
    "w-full rounded-md border border-neutral-200 p-3 text-left transition hover:border-teal-700/40 dark:border-neutral-800",
    "w-full rounded-md border border-neutral-200 p-3 text-left transition hover:border-neutral-400 dark:border-neutral-800",
  ],
  [
    "focus:ring-teal-600/35",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950",
  ],
  [
    "hover:ring-2 hover:ring-teal-500/40 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950",
    "hover:ring-2 hover:ring-neutral-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950",
  ],
  [
    "focus-visible:ring-2 focus-visible:ring-teal-500/80",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950",
  ],
  [
    "m-0 rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100",
    "m-0 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "? \"border-teal-600 bg-teal-50 ring-2 ring-teal-600/30 dark:border-teal-400 dark:bg-teal-950/50\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    ": \"rounded-lg border border-neutral-200 border-l-4 border-l-teal-600 bg-white p-3 shadow-sm dark:border-neutral-700 dark:border-l-teal-500 dark:bg-neutral-950\"",
    ": \"rounded-lg border border-neutral-200 border-l-4 border-l-neutral-700 bg-white p-3 shadow-sm dark:border-neutral-700 dark:border-l-neutral-400 dark:bg-neutral-950\"",
  ],
  [
    "border-l-4 border-l-teal-500",
    "border-l-4 border-l-neutral-600",
  ],
  [
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-[11px] font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100",
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-[11px] font-semibold text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
  ],
  [
    "mb-4 max-w-3xl border-l-4 border-teal-700 py-1 pl-3 dark:border-teal-500",
    "mb-4 max-w-3xl border-l-4 border-l-neutral-700 py-1 pl-3 dark:border-l-neutral-400",
  ],
  [
    "step.isNextStep ? \"border-l-4 border-l-teal-700 dark:border-l-teal-400\" : null",
    "step.isNextStep ? \"border-l-4 border-l-neutral-700 dark:border-l-neutral-400\" : null",
  ],
  [
    "mb-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-3 dark:border-teal-900 dark:bg-teal-950/40",
    "mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "border-teal-200/80 bg-teal-50/30 dark:border-teal-900/60 dark:bg-teal-950/20",
    "border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "? \"border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    "border-b border-teal-700/25 bg-teal-50 px-4 py-1 text-teal-950 dark:border-teal-800/60 dark:bg-teal-950 dark:text-teal-50",
    "border-b border-neutral-200 bg-neutral-50/80 px-4 py-1 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "focus-visible:ring-1 focus-visible:ring-teal-500",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "hover:ring-2 hover:ring-teal-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950",
    "hover:ring-2 hover:ring-neutral-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950",
  ],
  [
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:bg-neutral-950 dark:focus:text-neutral-50",
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:focus:bg-neutral-950 dark:focus:text-neutral-50",
  ],
  [
    "linkActive: \"font-semibold text-teal-900 dark:text-teal-200\"",
    "linkActive: \"font-semibold text-al-text-primary dark:text-neutral-100\"",
  ],
  [
    "ml-2 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100",
    "ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100",
  ],
  [
    "focus-within:ring-2 focus-within:ring-teal-700 focus-within:ring-offset-2 dark:focus-within:ring-teal-500",
    "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "? \"border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/30 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-400/30 forced-colors:outline\"",
    "? \"border-neutral-500 bg-neutral-50/80 ring-2 ring-neutral-400/30 dark:border-neutral-500 dark:bg-neutral-900/40 dark:ring-neutral-400/30 forced-colors:outline\"",
  ],
  [
    "rounded-xl border border-teal-700/20 bg-teal-50/60 p-5 dark:border-teal-500/20 dark:bg-teal-950/20",
    "rounded-xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "mt-3 m-0 rounded border border-teal-200 bg-white/70 px-3 py-2 text-xs text-teal-900 dark:border-teal-800 dark:bg-neutral-950/30 dark:text-teal-100",
    "mt-3 m-0 rounded border border-neutral-200 bg-white/70 px-3 py-2 text-xs text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950/30 dark:text-neutral-100",
  ],
  [
    "border-l-4 border-l-teal-600 dark:border-l-teal-500",
    "border-l-4 border-l-neutral-700 dark:border-l-neutral-400",
  ],
  [
    "flex flex-wrap items-start justify-between gap-3 rounded-md border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20",
    "flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "rounded-md border border-teal-700/30 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20",
    "rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
  ],
  [
    "space-y-2 rounded-md border border-teal-700/30 bg-al-surface-raised p-3",
    "space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3",
  ],
  [
    "isRecommended ? \"border-teal-600 ring-1 ring-teal-600/20 dark:border-teal-500\" : null",
    "isRecommended ? \"border-neutral-500 ring-1 ring-neutral-400/20 dark:border-neutral-500\" : null",
  ],
  [
    "isSelected ? \"ring-2 ring-teal-700/40 dark:ring-teal-400/50\" : null",
    "isSelected ? \"ring-2 ring-neutral-500/40 dark:ring-neutral-400/50\" : null",
  ],
  [
    "text-teal-800 dark:text-teal-200",
    "text-al-text-secondary dark:text-neutral-200",
  ],
  [
    "text-teal-700 dark:text-teal-200",
    "text-al-text-secondary dark:text-neutral-200",
  ],
  [
    "text-teal-700 dark:text-teal-300",
    "text-al-text-secondary dark:text-neutral-300",
  ],
  [
    "text-teal-800 dark:text-teal-300",
    "text-al-text-secondary dark:text-neutral-300",
  ],
  [
    "text-teal-800 dark:text-teal-200",
    "text-al-text-secondary dark:text-neutral-200",
  ],
  [
    "border-teal-300/70 dark:border-teal-800",
    "border-neutral-300 dark:border-neutral-700",
  ],
  [
    "focus-visible:outline-teal-700",
    "focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "focus-visible:ring-2 focus-visible:ring-teal-600",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
  ],
  [
    "const SELECTED_CLASS = \"rounded-md bg-teal-600 px-3 py-1.5 text-white\"",
    "const SELECTED_CLASS = \"rounded-md bg-[var(--al-primary-action-bg)] px-3 py-1.5 text-white\"",
  ],
  [
    "text-teal-600 dark:text-teal-400",
    "text-neutral-600 dark:text-neutral-400",
  ],
  [
    "text-teal-950 dark:text-teal-100",
    "text-al-text-primary dark:text-neutral-100",
  ],
  [
    "inline-block rounded-full bg-teal-100 px-2 py-0.5 font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    "inline-block rounded-full bg-neutral-100 px-2 py-0.5 font-semibold text-al-text-primary dark:bg-neutral-900/50 dark:text-neutral-300",
  ],
  [
    "inline-block shrink-0 min-h-[20px] rounded-full bg-teal-100 px-2.5 py-0.5 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    "inline-block shrink-0 min-h-[20px] rounded-full bg-neutral-100 px-2.5 py-0.5 text-al-text-primary dark:bg-neutral-900/50 dark:text-neutral-300",
  ],
  [
    "mt-4 border-t border-teal-100 pt-3 dark:border-teal-900/60",
    "mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700",
  ],
  [
    "? \"bg-teal-800 font-semibold text-white dark:bg-teal-600\"",
    "? \"bg-neutral-800 font-semibold text-white dark:bg-neutral-600\"",
  ],
  [
    "border-l-2 border-teal-500 pl-3",
    "border-l-2 border-neutral-500 pl-3",
  ],
  [
    "border-l-2 border-teal-600 pl-3",
    "border-l-2 border-neutral-600 pl-3",
  ],
  [
    "hover:text-teal-700 dark:hover:text-teal-300",
    "hover:text-al-text-primary dark:hover:text-neutral-200",
  ],
  [
    "hover:text-teal-800 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-teal-300",
    "hover:text-al-text-primary dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-200",
  ],
  [
    "hover:border-teal-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-teal-400 dark:hover:bg-neutral-900",
    "hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-neutral-500 dark:hover:bg-neutral-900",
  ],
  [
    "flex shrink-0 items-center gap-1 text-teal-700 dark:text-teal-400",
    "flex shrink-0 items-center gap-1 text-al-text-secondary dark:text-neutral-400",
  ],
  [
    "h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600",
    "h-4 w-4 rounded border-neutral-300 text-neutral-700 focus:ring-neutral-400",
  ],
  [
    "h-7 border-teal-800/30 bg-white px-2.5 text-teal-950 hover:bg-teal-100/80 dark:border-teal-200/40 dark:bg-transparent dark:text-teal-50 dark:hover:bg-teal-900",
    "h-7 border-neutral-300 bg-white px-2.5 text-al-text-primary hover:bg-neutral-50 dark:border-neutral-600 dark:bg-transparent dark:text-neutral-100 dark:hover:bg-neutral-900",
  ],
  [
    "? \"border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100\"",
    "? OPERATOR_SELECTION.tile",
  ],
  [
    "flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/90 to-white px-4 py-6 dark:border-teal-800/60 dark:from-teal-950/35 dark:to-neutral-950/80",
    "flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-neutral-300 bg-gradient-to-b from-neutral-50/90 to-white px-4 py-6 dark:border-neutral-700 dark:from-neutral-900/35 dark:to-neutral-950/80",
  ],
  [
    "h-32 w-full max-w-md text-teal-800/90 dark:text-teal-200/90",
    "h-32 w-full max-w-md text-neutral-700/90 dark:text-neutral-300/90",
  ],
  [
    "swatch: \"bg-teal-600\"",
    "swatch: \"bg-neutral-600\"",
  ],
  [
    "c: \"bg-teal-100 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100\"",
    "c: \"bg-neutral-100 text-al-text-primary dark:bg-neutral-900/40 dark:text-neutral-100\"",
  ],
  [
    "h-0.5 w-4 shrink-0 rounded-full bg-teal-300 dark:bg-teal-700",
    "h-0.5 w-4 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600",
  ],
  [
    "${base} bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-300",
    "${base} bg-neutral-100 text-al-text-primary dark:bg-neutral-900/80 dark:text-neutral-300",
  ],
  [
    "font-bold text-neutral-900 group-hover:text-teal-800 dark:text-neutral-100 dark:group-hover:text-teal-300",
    "font-bold text-neutral-900 group-hover:text-al-text-primary dark:text-neutral-100 dark:group-hover:text-neutral-200",
  ],
  [
    "pl-0.5 marker:text-teal-700 dark:marker:text-teal-400",
    "pl-0.5 marker:text-neutral-600 dark:marker:text-neutral-400",
  ],
  [
    "absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border border-teal-700 bg-white dark:border-teal-400 dark:bg-neutral-950",
    "absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border border-neutral-600 bg-white dark:border-neutral-400 dark:bg-neutral-950",
  ],
  [
    "text-2xl font-bold text-teal-600",
    "text-2xl font-bold text-al-text-primary",
  ],
  [
    "h-12 w-12 shrink-0 text-teal-700 dark:text-teal-400",
    "h-12 w-12 shrink-0 text-neutral-700 dark:text-neutral-400",
  ],
  [
    "dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
    "dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "mt-2 rounded-md border border-teal-500 bg-white/90 px-3 py-2 text-teal-950 dark:border-teal-600 dark:bg-teal-950/30 dark:text-teal-50",
    "mt-2 rounded-md border border-neutral-300 bg-white/90 px-3 py-2 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100",
  ],
  [
    "pointer-events-none fixed z-[10001] rounded-md ring-2 ring-teal-500 ring-offset-2 ring-offset-transparent dark:ring-teal-400",
    "pointer-events-none fixed z-[10001] rounded-md ring-2 ring-neutral-500 ring-offset-2 ring-offset-transparent dark:ring-neutral-400",
  ],
  [
    "font-semibold text-teal-700 dark:text-teal-400",
    "font-semibold text-al-text-secondary dark:text-neutral-400",
  ],
];

function ensureImports(content, neededTokens) {
  if (neededTokens.size === 0) {
    return content;
  }

  const importMatch = content.match(
    /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/design-tokens["'];?/,
  );

  if (!importMatch) {
    return content;
  }

  const existing = importMatch[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const merged = [...existing];

  for (const token of neededTokens) {
    if (!merged.includes(token)) {
      merged.push(token);
    }
  }

  if (merged.length === existing.length) {
    return content;
  }

  return content.replace(importMatch[0], `import { ${merged.join(", ")} } from "@/lib/design-tokens";`);
}

function processFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  const original = content;
  const neededTokens = new Set();

  for (const [from, tokenExpr] of CLASSNAME_LITERAL_REPLACEMENTS) {
    const quoted = `className="${from}"`;
    const replacement = `className={${tokenExpr}}`;

    if (content.includes(quoted)) {
      content = content.split(quoted).join(replacement);
      neededTokens.add(tokenExpr.split(".")[0]);
    }
  }

  for (const [from, to] of INLINE_REPLACEMENTS) {
    if (!content.includes(from)) {
      continue;
    }

    content = content.split(from).join(to);

    if (to.includes("OPERATOR_SELECTION")) {
      neededTokens.add("OPERATOR_SELECTION");
    }
  }

  if (content === original) {
    return false;
  }

  content = ensureImports(content, neededTokens);
  writeFileSync(filePath, content, "utf8");

  return true;
}

const files = walkTsFiles(ROOT);

let updated = 0;

for (const file of files) {
  if (processFile(file)) {
    updated += 1;
    console.log(`updated ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nUpdated ${updated} files.`);
