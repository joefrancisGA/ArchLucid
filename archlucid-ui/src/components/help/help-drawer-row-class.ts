import { cn } from "@/lib/utils";

/**
 * Shared help drawer topic/doc row. Flat list rows with dividers, not stacked cards:
 * when every row is elevated, elevation stops signalling which row matters.
 */
export function helpDrawerRowButtonClass(isHighlighted: boolean): string {
  return cn(
    "flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
    isHighlighted
      ? "bg-[var(--al-layer-hover)] dark:bg-neutral-800/80"
      : "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900",
  );
}

/** Divider treatment for help drawer row lists, replacing per-row card borders. */
export const HELP_DRAWER_ROW_LIST_CLASS =
  "m-0 divide-y divide-neutral-200/80 p-0 dark:divide-neutral-800";

export const HELP_DRAWER_CHEVRON_CLASS =
  "mt-0.5 h-4 w-4 shrink-0 text-neutral-400 opacity-70 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-neutral-500";
