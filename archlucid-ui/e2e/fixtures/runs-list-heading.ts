import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { BUYER_ASK_PAGE_TITLE } from "@/lib/buyer-polish-copy";
import {
  GOVERNANCE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE,
} from "@/lib/governance-overview-copy";
import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";

function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Primary page title on the reviews index server page (`src/app/(operator)/reviews/page.tsx`): rendered as
 * {@code <h1>} by {@link OperatorPageHeader}. Canonical URL is `/architecture/reviews`.
 * (`next.config.ts`).
 */
export const RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^${RUNS_LIST_PAGE_TITLES.buyerPolished.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  "i",
);

/**
 * Buyer-polished `/insights/ask-review-questions` uses {@link BUYER_ASK_PAGE_TITLE}; full-operator shell uses
 * "Ask review questions" (legacy "Ask about a review" kept for older snapshots).
 */
export const ASK_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^(Ask about a review|Ask review questions|${escapeRegExpLiteral(BUYER_ASK_PAGE_TITLE)})$`,
  "i",
);

/**
 * `/governance` page title — overview ({@link GOVERNANCE_OVERVIEW_PAGE_TITLE}), review context
 * ({@link GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE}), or legacy nav label {@link OPERATOR_NAV_LINK_LABELS.governanceWorkflow}.
 */
export const GOVERNANCE_PAGE_PRIMARY_HEADING_PATTERN = new RegExp(
  `^(${escapeRegExpLiteral(OPERATOR_NAV_LINK_LABELS.governanceWorkflow)}|${escapeRegExpLiteral(GOVERNANCE_OVERVIEW_PAGE_TITLE)}|${escapeRegExpLiteral(GOVERNANCE_REVIEW_CONTEXT_PAGE_TITLE)})$`,
  "i",
);

/** `/architecture/architectures/new` page H1 — {@link CREATE_ARCHITECTURE_LABEL}. */
export const CREATE_ARCHITECTURE_PAGE_HEADING_PATTERN = new RegExp(
  `^${escapeRegExpLiteral(CREATE_ARCHITECTURE_LABEL)}$`,
  "i",
);

/** `/architecture/reviews/new` page H1 — {@link START_REVIEW_LABEL}. */
export const START_REVIEW_PAGE_HEADING_PATTERN = new RegExp(
  `^${escapeRegExpLiteral(START_REVIEW_LABEL)}$`,
  "i",
);

/** `/governance/audit` page H1 — buyer-polished titles append the review label; search chrome uses H3 "Filter audit trail". */
export const AUDIT_PAGE_PRIMARY_HEADING_PATTERN = /^Audit trail( for .+)?$/i;
