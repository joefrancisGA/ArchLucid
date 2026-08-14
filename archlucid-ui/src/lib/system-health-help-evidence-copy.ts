import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SYSTEM_HEALTH_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_SOURCES_INTRO,
} from "@/lib/system-health-evidence-copy";

export const SYSTEM_HEALTH_HELP_CANONICAL_PATH = "/help/system-health" as const;

export const SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING = SYSTEM_HEALTH_CLAIM_DISCIPLINE_HEADING;

export const SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE =
  "System health reports workspace operational readiness (live/ready checks and build identity). It is not a sealed-review diligence Sources package.";

export const SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SYSTEM_HEALTH_HELP_SOURCES_INTRO = SYSTEM_HEALTH_SOURCES_INTRO;

/** Help Sources — no self-href to `/help/system-health`. */
export const SYSTEM_HEALTH_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Open connection status", href: "/administration/connection-status" },
  { label: "Connection status guide", href: inAppHelpHref("connection-status") },
  { label: "Troubleshooting guide", href: inAppHelpHref("troubleshooting") },
  { label: "Governance audit", href: GOVERNANCE_AUDIT_PATH },
] as const;

/** Drift guard: help claim aligns with operator negation substance. */
export const SYSTEM_HEALTH_HELP_OPERATOR_CLAIM = SYSTEM_HEALTH_CLAIM_DISCIPLINE;
