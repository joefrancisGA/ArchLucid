import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK } from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

import { ARCHITECTURE_SCORECARD_PATH } from "./architecture-scorecard-route";

export const ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE_HEADING = "What this scorecard is not";

export const ARCHITECTURE_SCORECARD_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE =
  "Savings figures are directional for pilot value discussions — not financial reporting, not a sealed review record, and not an evidence trail.";

export const ARCHITECTURE_SCORECARD_SOURCES_INTRO =
  "Open ROI summary, reviews, or methodology help before briefing sponsors from these tiles.";

/** Operator Sources — no self-href to the architecture scorecard. */
export const ARCHITECTURE_SCORECARD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Architecture scorecard help", href: inAppHelpHref("architecture-scorecard") },
  { label: "Workspace baseline settings", href: "/administration/baseline" },
  { label: TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label, href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
] as const;

export const ARCHITECTURE_SCORECARD_EVIDENCE_CANONICAL_PATH = ARCHITECTURE_SCORECARD_PATH;
