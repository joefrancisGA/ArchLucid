import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Prefer Architecture reviews H1 — list nav may still say Reviews. */
export const REVIEW_PACKAGES_HELP_PAGE_TITLE = "Architecture reviews";

export const REVIEW_PACKAGES_HELP_PAGE_SUBTITLE =
  "Browse, inspect, and export governed architecture reviews. The Reviews list is where those reviews live.";

export const REVIEW_PACKAGES_HELP_OVERVIEW =
  "An architecture review is the durable record for one governed assessment — findings, evidence, policy results, decisions, and exports after finalize. Open Reviews to browse reviews in your workspace.";

export const REVIEW_PACKAGES_HELP_PRIMARY_ACTIONS = {
  openReviews: {
    label: "Open reviews",
    href: "/architecture/reviews",
  },
  startAReview: {
    label: "Start a review",
    href: inAppHelpHref("evidence-intake"),
  },
  findingsGuide: {
    label: "Findings guide",
    href: inAppHelpHref("findings"),
  },
} as const;

export type ReviewPackagesHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

/** Sparse Related links (TB-1402) — no self-href to this topic. */
export const REVIEW_PACKAGES_HELP_RELATED: readonly ReviewPackagesHelpRelatedLink[] = [
  { label: "Start a review", href: inAppHelpHref("evidence-intake") },
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
] as const;
