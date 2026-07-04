import { cn } from "@/lib/utils";

import {
  OPERATOR_LAYOUT,
  OPERATOR_PAGE_CONTAINER,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_SHELL_STICKY_TOP_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

/**
 * Shared layout and typography for in-app `/help/*` topic pages.
 * Used by {@link HelpTopicMarkdownView} and {@link MarketingAccessibilityMarkdownFragment} (`presentation="help"`).
 */
export const HELP_PAGE_LAYOUT = {
  articleHeader: cn(
    "border-b border-neutral-200 pb-6 dark:border-neutral-800",
    OPERATOR_LAYOUT.sectionHeadingStack,
  ),
  contentGrid: "grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:items-start",
  contentColumn: cn("min-w-0", OPERATOR_PAGE_CONTAINER.variant.reading),
  proseRoot: "flex flex-col",
  sectionH2: cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-10 first:mt-0", OPERATOR_TYPOGRAPHY.sectionTitle),
  sectionH3: cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-7", OPERATOR_TYPOGRAPHY.cardTitle),
  paragraph: cn("my-3 leading-relaxed", OPERATOR_TYPOGRAPHY.body),
  bulletList: cn("my-4 list-disc space-y-1.5 pl-6", OPERATOR_TYPOGRAPHY.body),
  orderedList: cn("my-4 list-decimal space-y-1.5 pl-6", OPERATOR_TYPOGRAPHY.body),
  tableWrap: "my-5 mb-6 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
  table: cn("w-full min-w-[32rem] border-collapse text-left", OPERATOR_TYPOGRAPHY.body),
  tableHeadCell:
    "border-b border-neutral-200 bg-neutral-100 px-3 py-2.5 font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900",
  tableBodyCell: "border-b border-neutral-200 px-3 py-2.5 align-top dark:border-neutral-800",
  tableRowOdd: "bg-white dark:bg-neutral-950",
  tableRowEven: "bg-neutral-50/80 dark:bg-neutral-900/50",
  blockquote: cn(
    "my-5 border-l-4 border-neutral-300 pl-4 italic text-al-text-secondary dark:border-neutral-600",
    OPERATOR_TYPOGRAPHY.body,
  ),
  details:
    "my-5 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40",
  detailsBody: "mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700",
} as const;

export const HELP_PAGE_TOC = {
  nav: cn("lg:sticky lg:self-start", OPERATOR_SHELL_STICKY_TOP_CLASS),
  heading:
    "m-0 text-xs font-semibold uppercase tracking-[0.08em] text-al-text-primary dark:text-neutral-200",
  list: "m-0 mt-3 max-h-[min(70vh,28rem)] list-none space-y-1.5 overflow-y-auto p-0",
  link: cn(
    "block rounded-sm py-1 text-al-text-secondary underline-offset-2 transition-colors hover:text-teal-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:hover:text-teal-300",
    OPERATOR_TYPOGRAPHY.body,
  ),
  linkActive: "font-semibold text-teal-900 dark:text-teal-200",
  linkNested: "pl-3",
} as const;
