import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  SYSTEM_HEALTH_CANONICAL_PATH,
  SYSTEM_HEALTH_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_SOURCES,
  SYSTEM_HEALTH_SOURCES_INTRO,
} from "@/lib/system-health-evidence-copy";

export const SYSTEM_HEALTH_HELP_CANONICAL_PATH = "/help/system-health" as const;

export const SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace system health readiness — it is not a signed-review diligence Sources package.";

export const SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SYSTEM_HEALTH_HELP_SOURCES_INTRO = SYSTEM_HEALTH_SOURCES_INTRO;

export const SYSTEM_HEALTH_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: SYSTEM_HEALTH_CANONICAL_PATH },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Connection status help", href: "/help/connection-status" },
  { label: "Troubleshooting help", href: "/help/troubleshooting" },
  { label: "Governance audit", href: "/governance/audit" },
] as const;

export const SYSTEM_HEALTH_HELP_OPERATOR_CLAIM = SYSTEM_HEALTH_CLAIM_DISCIPLINE;
