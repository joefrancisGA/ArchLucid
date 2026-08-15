import { cn } from "@/lib/utils";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

/** Layout tokens for the public `/accessibility` statement. */
export const ACCESSIBILITY_PUBLIC_LAYOUT = {
  page: "accessibility-public-page w-full",
  skipLink:
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:bg-neutral-950 dark:focus:text-neutral-50",
  header: "border-b border-neutral-200 pb-8 dark:border-neutral-800 print:border-neutral-300",
  title: cn(MARKETING_TYPOGRAPHY.pageTitle, "text-balance text-al-text-primary"),
  lede: cn("mt-3 max-w-3xl text-balance text-al-text-secondary", MARKETING_TYPOGRAPHY.body),
  metaRow: cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  lastReviewed: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.body),
  metaSecondary: "text-al-text-secondary",
  utilities: "mt-4 flex flex-wrap gap-2 print:hidden",
  utilityButton:
    "inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
  atGlance:
    "rounded-md border border-neutral-200 bg-neutral-50/80 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/40 print:hidden",
  atGlanceTitle: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle),
  atGlanceNote: cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  atGlanceList: cn("m-0 mt-4 max-w-3xl list-none space-y-3 p-0", MARKETING_TYPOGRAPHY.body),
  atGlanceItemLabel: "font-semibold text-al-text-primary",
  revisionSection: "mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800 print:hidden",
  revisionTitle: cn(MARKETING_TYPOGRAPHY.cardTitle, "text-al-text-primary"),
  revisionNote: cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  revisionList: cn("m-0 mt-4 max-w-3xl list-none space-y-4 p-0", MARKETING_TYPOGRAPHY.body),
  revisionItem: "border-l-2 border-neutral-200 pl-4 dark:border-neutral-800",
  revisionItemMeta: cn("flex flex-wrap gap-x-3 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  revisionItemDate: "font-semibold text-al-text-primary",
  revisionItemVersion: "text-al-text-secondary",
  revisionItemSummary: cn("mt-1 leading-7 text-al-text-secondary", MARKETING_TYPOGRAPHY.body),
  reportLink: cn(MARKETING_SURFACES.inlineLink, "font-medium"),
} as const;
