import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECTION_STATUS_HELP_CANONICAL_PATH = "/help/connection-status" as const;

export const CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read the connection status summary strip and connector inventory — it is not a sealed-review diligence package.";

export const CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECTION_STATUS_HELP_SOURCES_INTRO =
  "Use these follow-ups when readiness counts turn into connector setup, runtime checks, or governance trails.";

/** Configure — finish connector setup. */
export const CONNECTION_STATUS_HELP_SOURCES_CONFIGURE: readonly EvidenceSourceLink[] = [
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Webhooks", href: "/integrations/webhooks" },
  { label: "Integration readiness help", href: inAppHelpHref("integration-readiness") },
] as const;

/** Diagnose — runtime and delivery health. */
export const CONNECTION_STATUS_HELP_SOURCES_DIAGNOSE: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
] as const;

/** Govern — audit and evidence trails. */
export const CONNECTION_STATUS_HELP_SOURCES_GOVERN: readonly EvidenceSourceLink[] = [
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const CONNECTION_STATUS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  ...CONNECTION_STATUS_HELP_SOURCES_CONFIGURE,
  ...CONNECTION_STATUS_HELP_SOURCES_DIAGNOSE,
  ...CONNECTION_STATUS_HELP_SOURCES_GOVERN,
] as const;
