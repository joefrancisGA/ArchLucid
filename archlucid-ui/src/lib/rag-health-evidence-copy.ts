import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { INTERNAL_RAG_HEALTH_PATH } from "@/lib/internal-ops-route-paths";

export const RAG_HEALTH_CANONICAL_PATH = INTERNAL_RAG_HEALTH_PATH;

export const RAG_HEALTH_HELP_TOPIC_LABEL = "How RAG corpus health works" as const;

export const RAG_HEALTH_FOLLOW_UPS_TITLE = "Where to go next";

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
