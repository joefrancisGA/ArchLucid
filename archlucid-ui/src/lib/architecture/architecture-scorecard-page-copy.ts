import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE =
  "Savings figures are directional for pilot value discussions — not financial reporting, not a signed review record, and not an evidence trail.";

export const ARCHITECTURE_SCORECARD_SOURCES_INTRO =
  "Open ROI summary, reviews, or methodology help before briefing sponsors from these tiles.";

export type ArchitectureScorecardSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the architecture scorecard. */
export const ARCHITECTURE_SCORECARD_SOURCES: readonly ArchitectureScorecardSourceLink[] = [
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Architecture scorecard help", href: inAppHelpHref("architecture-scorecard") },
  { label: "Workspace baseline settings", href: "/administration/baseline" },
  { label: "Workspace overview", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
] as const;

export const ARCHITECTURE_SCORECARD_CANONICAL_PATH = ARCHITECTURE_SCORECARD_PATH;

export const ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL = "How architecture scorecards work";

export const ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER =
  "This estimate is directional. It is intended for pilot value discussions, not financial reporting.";
