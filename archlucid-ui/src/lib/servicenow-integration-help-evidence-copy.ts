import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_SOURCES,
  SERVICENOW_INTEGRATION_SOURCES_INTRO,
} from "@/lib/servicenow-integration-evidence-copy";

export const SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH = "/help/servicenow-integration" as const;

export const SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE =
  "This guide explains ServiceNow outbound routing and connection health — it is not a sealed-review diligence Sources package.";

export const SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO = SERVICENOW_INTEGRATION_SOURCES_INTRO;

export const SERVICENOW_INTEGRATION_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "ServiceNow integration", href: SERVICENOW_INTEGRATION_CANONICAL_PATH },
  ...SERVICENOW_INTEGRATION_SOURCES,
] as const;

export const SERVICENOW_INTEGRATION_HELP_OPERATOR_CLAIM = SERVICENOW_INTEGRATION_CLAIM_DISCIPLINE;
