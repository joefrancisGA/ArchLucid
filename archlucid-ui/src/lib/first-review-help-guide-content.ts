import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_HELP_PATH } from "@/lib/first-review-help-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FIRST_REVIEW_HELP_PAGE_TITLE = "First-run evidence checklist";

export const FIRST_REVIEW_HELP_PAGE_SUBTITLE =
  "Admin/SE printable checklist for Azure extractor Tier 1, finalize, and sponsor-packet proof before a demo kickoff. Not the default customer help path.";

export const FIRST_REVIEW_HELP_OVERVIEW =
  "Use this checklist when you need a short printable table of SE/ops success signals before a sponsor demo. Customer architects should stay on Your first architecture review. Capture run id and correlation id on any failed step before treating the package as demo-ready.";

export const FIRST_REVIEW_HELP_CLAIM_DISCIPLINE =
  "Checklist completion and a sealed review record are architecture-review evidence for SE demos — not certification.";

export const FIRST_REVIEW_HELP_EVIDENCE_ARC = [
  "Host + auth ready — API healthy with the intended auth mode for this environment.",
  "Extractor Tier 1 ZIP — customer-subscription inventory attached to a new review.",
  "Execute and finalize — sealed review record with non-empty artifacts.",
  "Sponsor proof — ROI/basis text present when shown; export the sponsor briefing.",
  "Support IDs — record run id and correlation id before opening a ticket.",
] as const;

export const FIRST_REVIEW_HELP_PRIMARY_ACTIONS = {
  openBuyerFirstReview: {
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  },
  startArchitectureReview: {
    label: "Start architecture review",
    href: "/architecture/reviews/new",
  },
  openAuditTrail: {
    label: "Open audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
} as const;

export type FirstReviewHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Sponsor-safe / SE Sources — no self-href to this topic. */
export const FIRST_REVIEW_HELP_SOURCES: readonly FirstReviewHelpSourceLink[] = [
  { label: "Your first architecture review", href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Open audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const FIRST_REVIEW_HELP_CANONICAL_PATH = FIRST_REVIEW_HELP_PATH;
