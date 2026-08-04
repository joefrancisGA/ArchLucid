import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EXECUTIVE_SCORECARD_CANONICAL_PATH = "/executive/scorecard" as const;

export const EXECUTIVE_SCORECARD_CLAIM_DISCIPLINE =
  "Sponsor scorecard metrics summarize completed reviews, findings pressure, and directional hours for the selected window — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Audit or a finalized architecture review when you need governed trails.";

export const EXECUTIVE_SCORECARD_SOURCES_INTRO =
  "Use these follow-ups when a KPI needs package detail, sponsor exports, ROI methodology, or product orientation.";

export type ExecutiveScorecardSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/executive/scorecard`. */
export const EXECUTIVE_SCORECARD_SOURCES: readonly ExecutiveScorecardSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Sponsor executive summary", href: "/sponsor-report/executive-summary" },
  { label: "Architecture scorecard", href: "/insights/architecture-scorecard" },
  { label: "Audit", href: "/governance/audit" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
