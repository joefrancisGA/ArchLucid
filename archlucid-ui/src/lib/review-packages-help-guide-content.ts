import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Prefer Architecture packages H1 (TB-1400) — list nav may still say Reviews. */
export const REVIEW_PACKAGES_HELP_PAGE_TITLE = "Architecture packages";

export const REVIEW_PACKAGES_HELP_PAGE_SUBTITLE =
  "Browse, inspect, and export governed architecture packages. The Reviews list is where those packages live.";

export const REVIEW_PACKAGES_HELP_OVERVIEW =
  "An architecture package is the durable record for one architecture review — findings, evidence, policy results, decisions, and exports after finalize. Open Reviews to browse packages in your workspace.";

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
