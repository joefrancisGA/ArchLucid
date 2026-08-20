import {
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SPONSOR_DASHBOARD_HELP_CANONICAL_PATH = "/help/sponsor-dashboard" as const;

const SPONSOR_DASHBOARD_HELP_SCORECARD_PATH = "/insights/architecture-scorecard" as const;

export const SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE =
  "This guide explains sponsor dashboard KPIs, trends, and exports — open Architecture reviews, Evidence trail, or Trust Center when you need export-ready records.";

export const SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SPONSOR_DASHBOARD_HELP_SOURCES_INTRO =
  "Use these follow-ups when portfolio KPIs need architecture reviews, grounded Q&A, traceable ROI methodology, or assurance cites.";

/** Help follow-ups — no self-href; scorecard lives in the feature grid. */
export const SPONSOR_DASHBOARD_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  ...ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES.filter(
    (source) => source.href !== SPONSOR_DASHBOARD_HELP_SCORECARD_PATH,
  ),
  { label: "ROI summary help", href: inAppHelpHref("roi-summary") },
];

/** Legacy operator-surface alias — same affirmative claim as help discipline band. */
export const SPONSOR_DASHBOARD_HELP_OPERATOR_CLAIM = SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE;
