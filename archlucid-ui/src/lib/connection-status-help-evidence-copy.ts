import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECTION_STATUS_HELP_CANONICAL_PATH = "/help/connection-status" as const;

export const CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read connection status tiles — it is not a signed-review diligence Sources package.";

export const CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECTION_STATUS_HELP_SOURCES_INTRO =
  "Use these follow-ups when readiness tiles turn into connector setup, system health checks, or integration methodology.";

export const CONNECTION_STATUS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: CONNECTION_STATUS_CANONICAL_PATH },
  { label: "System health", href: "/administration/system-health" },
  { label: "Integration readiness help", href: inAppHelpHref("integration-readiness") },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
