import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ADMIN_HEALTH_CANONICAL_PATH = "/internal/health" as const;

export const ADMIN_HEALTH_HELP_TOPIC_LABEL = "How admin diagnostics work" as const;

export const ADMIN_HEALTH_CLAIM_DISCIPLINE =
  "Diagnostics dashboard shows workspace health, readiness, and configuration advisories for architects — it is not a sealed-review diligence Sources package. Open System health, Audit, or Assurance status when you need governed or evaluation trails.";

export const ADMIN_HEALTH_SOURCES_INTRO =
  "Use these follow-ups when diagnostics need customer-facing readiness, activity trails, or troubleshooting guides.";


/** Operator Sources — no self-href to /internal/health. */
export const ADMIN_HEALTH_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Configuration summary", href: "/internal/configuration" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
