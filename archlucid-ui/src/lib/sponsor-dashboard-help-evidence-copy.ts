import {
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SPONSOR_DASHBOARD_HELP_CANONICAL_PATH = "/help/sponsor-dashboard" as const;

const SPONSOR_DASHBOARD_HELP_SCORECARD_PATH = "/insights/architecture-scorecard" as const;

export const SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE =
  "This guide explains sponsor dashboard KPIs, trends, and sponsor exports — use it to orient portfolio governance posture, then open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails or assurance cites.";

export const SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SPONSOR_DASHBOARD_HELP_SOURCES_INTRO = ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO;

/** Help follow-ups — no self-href; scorecard lives in the feature grid. */
export const SPONSOR_DASHBOARD_HELP_SOURCES: readonly EvidenceSourceLink[] =
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES.filter(
    (source) => source.href !== SPONSOR_DASHBOARD_HELP_SCORECARD_PATH,
  );

/** Legacy operator-surface alias — same affirmative claim as help discipline band. */
export const SPONSOR_DASHBOARD_HELP_OPERATOR_CLAIM = SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE;
