import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import { INTERNAL_ITSM_CONNECTORS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ADMIN_ITSM_CONNECTORS_CANONICAL_PATH = INTERNAL_ITSM_CONNECTORS_PATH;

export const ITSM_CONNECTORS_HELP_TOPIC_LABEL = "How ITSM connectors work" as const;

export const ADMIN_ITSM_CONNECTORS_CLAIM_DISCIPLINE =
  "ITSM connectors configures deployment credentials and tenant routing overrides for Jira and ServiceNow — it is not a signed-review diligence Sources package. Open buyer Integrations readiness or Audit when you need export posture or activity trails.";

export const ADMIN_ITSM_CONNECTORS_SOURCES_INTRO =
  "Use these follow-ups when connector onboarding needs buyer export surfaces, readiness checks, or troubleshooting.";


/** Operator Sources — no self-href to /internal/integrations/itsm. */
export const ADMIN_ITSM_CONNECTORS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Integration readiness", href: INTEGRATIONS_READINESS_PATH },
  { label: "Jira integration", href: INTEGRATIONS_JIRA_PATH },
  { label: "ServiceNow integration", href: INTEGRATIONS_SERVICENOW_PATH },
  { label: "System health", href: "/administration/system-health" },
  { label: "Integration readiness help", href: inAppHelpHref("integration-readiness") },
] as const;
