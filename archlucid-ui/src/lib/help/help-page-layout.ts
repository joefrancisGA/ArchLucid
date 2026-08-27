import { cn } from "@/lib/utils";

import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_PAGE_CONTAINER,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_SHELL_STICKY_TOP_CLASS,
  OPERATOR_TYPE_SCALE,
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
  contentGrid: cn(
    "grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start",
    OPERATOR_PAGE_CONTAINER.variant.workflow,
  ),
  technicalReferenceGrid:
    "grid grid-cols-1 justify-start gap-10 lg:grid-cols-[minmax(0,52rem)_16.5rem] lg:items-start",
  contentColumn: "min-w-0 w-full max-w-none",
  readingBody: OPERATOR_TYPE_SCALE.helpReadingBody,
  technicalReferenceArticle: OPERATOR_PAGE_CONTAINER.variant.workflow,
  technicalReferenceColumn: "min-w-0 w-full max-w-none lg:max-w-[52rem]",
  technicalReferenceSkipLink: cn(
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow-md dark:focus:bg-neutral-950",
    OPERATOR_TYPOGRAPHY.body,
  ),
  proseRoot: "flex flex-col",
  sectionH2: cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-10 first:mt-0", OPERATOR_TYPOGRAPHY.sectionTitle),
  compactSectionH2: cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-6 first:mt-0", OPERATOR_TYPOGRAPHY.sectionTitle),
  sectionH3: cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-7", OPERATOR_TYPOGRAPHY.cardTitle),
  paragraph: cn("my-3", OPERATOR_TYPE_SCALE.helpReadingBody),
  bulletList: cn("my-4 list-disc space-y-1.5 pl-6", OPERATOR_TYPE_SCALE.helpReadingBody),
  orderedList: cn("my-4 list-decimal space-y-1.5 pl-6", OPERATOR_TYPE_SCALE.helpReadingBody),
  tableWrap: "my-5 mb-6 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
  compactTableWrap: "my-3 mb-4 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800",
  table: cn("w-full min-w-[32rem] border-collapse text-left", OPERATOR_TYPOGRAPHY.body),
  tableHeadCell:
    "border-b border-neutral-200 bg-neutral-100 px-3 py-2.5 font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900",
  tableBodyCell: "border-b border-neutral-200 px-3 py-2.5 align-top dark:border-neutral-800",
  tableRowOdd: "bg-white dark:bg-neutral-950",
  tableRowEven: "bg-neutral-50/80 dark:bg-neutral-900/50",
  blockquote: cn(
    "my-5 border-l-4 border-neutral-300 pl-4 italic text-al-text-secondary dark:border-neutral-600",
    OPERATOR_TYPE_SCALE.helpReadingBody,
  ),
  details:
    "my-5 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40",
  detailsBody: "mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700",
  /** Neutral bordered panel for help action/orientation blocks (TB-2092). */
  contentPanel:
    "space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
  workflowStepNumber:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-sm font-semibold text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
  workflowStepNumberMd:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-sm font-semibold text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
  /** Emphasized current step in multi-state workflow steppers (TB-2092). */
  workflowStepNumberCurrent:
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-500 bg-neutral-100 text-sm font-semibold text-al-text-primary dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-100",
  workflowStepPanelCurrent: "border-l-[3px] border-l-neutral-700 dark:border-l-neutral-400",
  orientationLinkTile:
    "rounded-md border border-neutral-200 bg-white p-4 no-underline transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600 dark:hover:bg-neutral-900/60",
  /** Neutral in-page anchor pills on technical reference landing strips (TB-2092). */
  referenceTagPill:
    "inline-flex rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm no-underline transition-colors hover:border-neutral-400 hover:bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-600 dark:hover:bg-neutral-900/60",
  /** Selected specialty template card emphasis without teal tint (TB-2092). */
  selectedCardRing:
    "ring-2 ring-neutral-400/70 ring-offset-2 ring-offset-white dark:ring-neutral-500/50 dark:ring-offset-neutral-950",
  selectionFooterDivider: "border-t border-neutral-200 pt-3 dark:border-neutral-700",
} as const;

/** Minimum `##` / `###` headings before the sticky TOC rail renders. */
export const HELP_PAGE_MIN_TOC_HEADINGS = 4;

/** Single-column layout when the TOC rail is hidden (fewer than four headings). */
export function resolveHelpPageContentGridClass(headingCount: number): string {
  if (headingCount < HELP_PAGE_MIN_TOC_HEADINGS) {
    return cn("min-w-0 space-y-6 w-full max-w-none lg:max-w-[52rem]");
  }

  return HELP_PAGE_LAYOUT.contentGrid;
}

export const HELP_PAGE_TOC = {
  nav: cn(
    "xl:sticky xl:self-start",
    OPERATOR_SHELL_STICKY_TOP_CLASS,
    "xl:max-h-[calc(100dvh-var(--app-shell-sticky,6rem)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain",
  ),
  heading:
    "m-0 text-xs font-semibold uppercase tracking-[0.08em] text-al-text-primary dark:text-neutral-200",
  list: "m-0 mt-3 list-none space-y-1.5 p-0",
  link: cn("block rounded-sm py-1", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body),
  linkActive: "font-semibold text-al-text-primary dark:text-neutral-100",
  linkNested: "pl-3",
  referenceSearchInput: cn(
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-al-text-primary shadow-sm placeholder:text-al-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950",
    OPERATOR_TYPOGRAPHY.body,
  ),
  referenceSearchMeta: "mt-2 text-xs text-al-text-secondary",
  referenceGroup: "rounded-md border border-transparent",
  referenceGroupOpen: "border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/30",
  referenceGroupSummary: cn(
    "flex list-none cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 marker:content-none [&::-webkit-details-marker]:hidden",
    OPERATOR_TYPOGRAPHY.body,
  ),
  referenceGroupChildren: "m-0 list-none space-y-1 border-l border-neutral-200 py-1 pl-3 dark:border-neutral-800",
} as const;
