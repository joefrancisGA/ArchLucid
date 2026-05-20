/**
 * Primary page title on the reviews index server page (`src/app/(operator)/reviews/page.tsx`): rendered as
 * {@code <h2>} by {@link OperatorPageHeader}. Canonical URL is `/reviews`; `/runs` permanently redirects there
 * (`next.config.ts`).
 */
/** Buyer-polished shell uses "Review packages" on the reviews index (`RunsPageView`). */
export const RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN = /^(Architecture reviews|Review packages)$/i;

/** Buyer-polished `/ask` uses "Evidence-backed review questions"; full-operator shell uses "Ask about a review". */
export const ASK_PAGE_PRIMARY_HEADING_PATTERN = /^(Ask about a review|Evidence-backed review questions)$/i;
