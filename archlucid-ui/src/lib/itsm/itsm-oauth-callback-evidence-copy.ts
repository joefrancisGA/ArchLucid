import { INTEGRATIONS_JIRA_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ITSM_OAUTH_CALLBACK_CANONICAL_PATH = "/integrations/itsm/oauth/callback" as const;

export const ITSM_OAUTH_CALLBACK_HELP_TOPIC_LABEL = "How Atlassian OAuth callback works" as const;

export const ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE =
  "This page completes Atlassian OAuth consent for the Jira connector — it is a handshake status surface, not a sealed-review diligence Sources package. Open Jira integration settings or Integration readiness when you need connector configuration or health checks.";

export const ITSM_OAUTH_CALLBACK_SOURCES_INTRO =
  "Use these follow-ups when consent succeeds or fails and you need connector settings, readiness, or assurance orientation.";


/** Operator Sources — no self-href to the OAuth callback path. */
export const ITSM_OAUTH_CALLBACK_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Jira integration", href: INTEGRATIONS_JIRA_PATH },
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "How integration readiness works", href: inAppHelpHref("integration-readiness") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/security-trust" },
] as const;
