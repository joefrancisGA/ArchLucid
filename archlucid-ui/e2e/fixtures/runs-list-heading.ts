import { BUYER_ASK_PAGE_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";

function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Primary page title on the reviews index server page (`src/app/(operator)/reviews/page.tsx`): rendered as
 * {@code <h2>} by {@link OperatorPageHeader}. Canonical URL is `/reviews`; `/runs` permanently redirects there
 * (`next.config.ts`).
 */
export const RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^${RUNS_LIST_PAGE_TITLES.buyerPolished.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  "i",
);

/** Buyer-polished `/ask` uses {@link BUYER_ASK_PAGE_TITLE}; full-operator shell uses "Ask about a review". */
export const ASK_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^(Ask about a review|${escapeRegExpLiteral(BUYER_ASK_PAGE_TITLE)})$`,
  "i",
);

/** `/governance` page title — {@link OPERATOR_NAV_LINK_LABELS.governanceWorkflow} (TB-526). */
export const GOVERNANCE_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^${escapeRegExpLiteral(OPERATOR_NAV_LINK_LABELS.governanceWorkflow)}$`,
  "i",
);
