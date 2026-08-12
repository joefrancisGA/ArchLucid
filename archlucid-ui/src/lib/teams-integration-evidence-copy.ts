import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";

export const TEAMS_INTEGRATION_CANONICAL_PATH = "/integrations/teams" as const;

export const TEAMS_INTEGRATION_CLAIM_DISCIPLINE =
  "Teams destinations route governance alerts to Microsoft Teams channels — they are not a signed-review diligence Sources package. Open Alert rules, Integration readiness, or Audit when you need operational or governed trails.";

export const TEAMS_INTEGRATION_SOURCES_INTRO =
  "Use these follow-ups when the Teams connector needs routing rules, readiness checks, or a sibling notification channel.";


/** Operator Sources — no self-href to `/integrations/teams`. */
export const TEAMS_INTEGRATION_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Slack", href: "/integrations/slack" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
