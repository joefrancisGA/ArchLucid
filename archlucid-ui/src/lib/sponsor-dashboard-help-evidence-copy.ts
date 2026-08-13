import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH,
  ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";

export const SPONSOR_DASHBOARD_HELP_CANONICAL_PATH = "/help/sponsor-dashboard" as const;

export const SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE =
  "This guide explains sponsor dashboard KPIs, trends, and sponsor exports — it is not a signed-review diligence Sources package.";

export const SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SPONSOR_DASHBOARD_HELP_SOURCES_INTRO = ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO;

export const SPONSOR_DASHBOARD_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Sponsor dashboard", href: ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH },
  ...ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
] as const;

export const SPONSOR_DASHBOARD_HELP_OPERATOR_CLAIM = ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE;
