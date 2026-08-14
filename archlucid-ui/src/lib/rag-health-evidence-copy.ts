import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const RAG_HEALTH_CLAIM_DISCIPLINE =
  "RAG corpus health reports chunk counts and last-indexed timestamps for this API host — it is not a sealed-review diligence Sources package. Open Diagnostics, System health, or Audit when you need readiness or governed trails.";

export const RAG_HEALTH_SOURCES_INTRO =
  "Use these follow-ups when corpus freshness needs operational readiness checks or troubleshooting.";


/** Operator Sources — no self-href to /internal/rag-health. */
export const RAG_HEALTH_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Diagnostics dashboard", href: "/internal/health" },
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
] as const;
