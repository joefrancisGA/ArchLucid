/**
 * Page-header help chrome: icon + caption without a Button outline border.
 * Help affordances must not read as tertiary actions (TB-2168 bans ghost; outline was the wrong substitute).
 */
export const PAGE_CONTEXTUAL_HELP_TRIGGER_CLASSNAME =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-2 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
