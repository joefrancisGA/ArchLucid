import { cn } from "@/lib/utils";

import {
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_SHELL_STICKY_TOP_CLASS,
} from "@/lib/design-tokens";

/** Layout and typography tokens for the public privacy policy reading experience. */
export const PRIVACY_POLICY_LAYOUT = {
  page: "privacy-policy-page w-full",
  skipLink:
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:focus:bg-neutral-950 dark:focus:text-neutral-50",
  grid: "grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] xl:items-start xl:gap-x-16 xl:gap-y-12",
  article:
    "min-w-0 flex-1 text-neutral-800 dark:text-neutral-200 print:max-w-none print:text-black",
  header: "border-b border-neutral-200 pb-8 dark:border-neutral-800 print:border-neutral-300",
  breadcrumb: "mb-3",
  title: cn(MARKETING_TYPOGRAPHY.pageTitle, "text-balance text-neutral-900 dark:text-neutral-50"),
  lede: cn("mt-3 max-w-3xl text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.body),
  metaRow: cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  effectiveDate: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.body),
  metaSecondary: "text-al-text-secondary",
  utilities: "mt-4 flex flex-wrap gap-2 print:hidden",
  utilityButton:
    "inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
  quickNav: "mt-6 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40 print:hidden",
  quickNavTitle: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  quickNavNote: cn("mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  quickNavList: "m-0 mt-3 flex flex-wrap gap-2 p-0 list-none",
  quickNavLink:
    "inline-flex rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 underline-offset-2 hover:bg-neutral-50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
  progressTrack:
    "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-neutral-200/80 dark:bg-neutral-800/80 print:hidden motion-reduce:hidden",
  progressBar: "h-full bg-teal-700 transition-[width] duration-150 ease-out motion-reduce:transition-none dark:bg-teal-500",
  backToTop:
    "fixed bottom-6 right-6 z-40 rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-md hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 print:hidden motion-reduce:transition-none",
  focusedToggle: cn(MARKETING_TYPOGRAPHY.meta, "font-medium text-al-text-primary underline-offset-2 hover:underline"),
  relatedSection: "mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800 print:break-before-page",
  relatedTitle: cn(MARKETING_TYPOGRAPHY.sectionTitle, "text-neutral-900 dark:text-neutral-50"),
  relatedList: "m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2",
  relatedCard:
    "rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/60",
  relatedCardTitle: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  relatedCardPurpose: cn("mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  atGlance:
    "mt-8 rounded-md border border-neutral-200 bg-neutral-50/80 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/40 print:hidden",
  atGlanceTitle: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  atGlanceNote: cn("mt-2 max-w-[68ch] text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  atGlanceList: cn("m-0 mt-4 max-w-[68ch] list-none space-y-3 p-0", MARKETING_TYPOGRAPHY.body, "text-[1.0625rem] leading-7"),
  atGlanceItemLabel: "font-semibold text-al-text-primary",
  revisionSection: "mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800 print:hidden",
  revisionTitle: cn(MARKETING_TYPOGRAPHY.cardTitle, "text-al-text-primary"),
  revisionNote: cn("mt-2 max-w-[68ch] text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  revisionList: cn("m-0 mt-4 max-w-[68ch] list-none space-y-4 p-0", MARKETING_TYPOGRAPHY.body),
  revisionItem: "border-l-2 border-neutral-200 pl-4 dark:border-neutral-800",
  revisionItemMeta: cn("flex flex-wrap gap-x-3 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  revisionItemDate: "font-semibold text-al-text-primary",
  revisionItemVersion: "text-al-text-secondary",
  revisionItemSummary: cn("mt-1 leading-7 text-al-text-secondary", MARKETING_TYPOGRAPHY.body),
} as const;

export const PRIVACY_POLICY_TOC = {
  nav: cn(
    "xl:sticky xl:self-start xl:pl-2 print:hidden",
    OPERATOR_SHELL_STICKY_TOP_CLASS,
    "xl:max-h-[calc(100dvh-var(--app-shell-sticky,6rem)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain",
  ),
  heading: cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  mobileDetails: "rounded-md border border-neutral-200 bg-al-surface-raised p-3 xl:hidden dark:border-neutral-800",
  mobileSummary: cn("cursor-pointer font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  list: "m-0 mt-3 list-none space-y-2 p-0",
  link: cn("block rounded-sm py-1.5", MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.body),
  linkActive: "font-semibold text-al-text-primary dark:text-neutral-100",
  linkNested: "pl-3 text-[0.95em]",
} as const;

export const PRIVACY_POLICY_PROSE = {
  root: "flex flex-col",
  sectionHeadingRow: cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    "group mt-14 pt-12 first:mt-0 first:pt-0 flex items-start justify-between gap-4",
  ),
  sectionH2: cn(
    MARKETING_TYPOGRAPHY.sectionTitle,
    "min-w-0 flex-1 text-balance text-neutral-900 dark:text-neutral-50",
  ),
  sectionH3Row: cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    "group mt-10 flex items-start justify-between gap-3",
  ),
  sectionH3: cn(MARKETING_TYPOGRAPHY.cardTitle, "min-w-0 flex-1 text-al-text-primary"),
  paragraph: cn("my-5 max-w-[68ch] leading-7", MARKETING_TYPOGRAPHY.body, "text-[1.0625rem]"),
  bulletList: cn("my-5 max-w-[68ch] list-disc space-y-2.5 pl-6 leading-7", MARKETING_TYPOGRAPHY.body, "text-[1.0625rem]"),
  orderedList: cn("my-5 max-w-[68ch] list-decimal space-y-2.5 pl-6 leading-7", MARKETING_TYPOGRAPHY.body, "text-[1.0625rem]"),
  tableWrap:
    "my-8 overflow-x-auto rounded-md border border-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-800",
  table: cn("w-full min-w-0 border-collapse text-left sm:min-w-[32rem] xl:min-w-[42rem]", MARKETING_TYPOGRAPHY.body),
  tableHeadCell:
    "border-b border-neutral-200 bg-neutral-100 px-5 py-3.5 font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900",
  tableBodyCell: "border-b border-neutral-200 px-5 py-3.5 align-top dark:border-neutral-800",
  tableRowOdd: "bg-white dark:bg-neutral-950",
  tableRowEven: "bg-neutral-50/80 dark:bg-neutral-900/50",
} as const;
