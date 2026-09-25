import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { INTERNAL_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const OPERATIONAL_ERRORS_PAGE_TITLE = "Operational errors" as const;

export const OPERATIONAL_ERRORS_CLAIM_DISCIPLINE =
  "Operational error rows are internal triage signals — not customer-facing status, sealed review records, or audit exports." as const;

export const OPERATIONAL_ERRORS_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const OPERATIONAL_ERRORS_SOURCES_INTRO =
  "Join correlation IDs to audit and health surfaces before escalating platform incidents." as const;

export const OPERATIONAL_ERRORS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Internal health", href: INTERNAL_HEALTH_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Engineering troubleshooting", href: inAppHelpHref("engineering-troubleshooting") },
  { label: "System health", href: "/administration/system-health" },
  { label: "Failed integration messages", href: "/internal/failed-integration-messages" },
] as const;
