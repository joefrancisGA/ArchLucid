import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture-scorecard-route";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Retired sponsor scorecard bookmark — merged onto the executive dashboard. */
export const EXECUTIVE_SCORECARD_CANONICAL_PATH = EXECUTIVE_DASHBOARD_HREF;

export { LEGACY_EXECUTIVE_SCORECARD_PATH };

export const EXECUTIVE_SCORECARD_CLAIM_DISCIPLINE =
  "Sponsor scorecard metrics summarize completed reviews, findings pressure, and directional hours for the selected window — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Audit or a finalized architecture review when you need governed trails.";

export const EXECUTIVE_SCORECARD_SOURCES_INTRO =
  "Use these follow-ups when a KPI needs package detail, sponsor exports, ROI methodology, or product orientation.";

export type ExecutiveScorecardSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the retired `/executive/scorecard` bookmark. */
export const EXECUTIVE_SCORECARD_SOURCES: readonly ExecutiveScorecardSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Sponsor executive summary", href: "/insights/executive-summary" },
  { label: "Architecture scorecard", href: ARCHITECTURE_SCORECARD_PATH },
  { label: "Audit", href: "/governance/audit" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
