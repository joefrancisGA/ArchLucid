import { cn } from "@/lib/utils";

/** Shared help drawer topic/doc row — card affordance aligned with HelpPanel guide links. */
export function helpDrawerRowButtonClass(isHighlighted: boolean): string {
  return cn(
    "flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 text-left shadow-sm transition-colors",
    isHighlighted
      ? "border-neutral-300 bg-[var(--al-layer-hover)] dark:border-neutral-600 dark:bg-neutral-800/80"
      : "border-neutral-200/90 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50 dark:hover:border-neutral-500 dark:hover:bg-neutral-900",
  );
}

export const HELP_DRAWER_CHEVRON_CLASS =
  "mt-0.5 h-4 w-4 shrink-0 text-neutral-400 opacity-70 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-neutral-500";
