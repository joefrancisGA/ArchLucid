import { cn } from "@/lib/utils";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

/** Layout tokens for the public `/trust` Trust Center page. */
export const TRUST_CENTER_PUBLIC_LAYOUT = {
  page: "trust-center-public-page w-full",
  skipLink:
    "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:bg-neutral-950 dark:focus:text-neutral-50",
  metaRow: cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  lastReviewed: cn("font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.body),
  metaSecondary: "text-al-text-secondary",
  revisionSection: "border-t border-neutral-200 pt-8 dark:border-neutral-800 print:hidden",
  revisionTitle: cn(MARKETING_TYPOGRAPHY.cardTitle, "text-al-text-primary"),
  revisionNote: cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  revisionList: cn("m-0 mt-4 max-w-3xl list-none space-y-4 p-0", MARKETING_TYPOGRAPHY.body),
  revisionItem: "border-l-2 border-neutral-200 pl-4 dark:border-neutral-800",
  revisionItemMeta: cn("flex flex-wrap gap-x-3 gap-y-1", MARKETING_TYPOGRAPHY.meta),
  revisionItemDate: "font-semibold text-al-text-primary",
  revisionItemVersion: "text-al-text-secondary",
  revisionItemSummary: cn("mt-1 leading-7 text-al-text-secondary", MARKETING_TYPOGRAPHY.body),
  relatedHelpList: cn("m-0 mt-4 flex flex-wrap gap-x-4 gap-y-2", MARKETING_TYPOGRAPHY.body),
  relatedHelpLink: MARKETING_SURFACES.inlineLink,
  vocabularyDisclosure:
    "rounded-lg border border-neutral-200 dark:border-neutral-800 print:hidden",
  vocabularySummary: cn("cursor-pointer px-4 py-2", MARKETING_TYPOGRAPHY.cardTitle),
  vocabularyBody: "space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800",
  vocabularyIntro: cn("m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta),
  vocabularyPeerList: cn("m-0 list-none space-y-3 p-0", MARKETING_TYPOGRAPHY.body),
  vocabularyPeerWhen: cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.meta),
} as const;
