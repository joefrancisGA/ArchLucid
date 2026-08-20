import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ADMINISTRATION_HUB_CLAIM_DISCIPLINE =
  "Settings is the launcher for workspace, identity, billing, security, and support configuration — not a full audit export. Open System health, Audit, or a sealed record when you need operational or export-ready records.";

export const ADMINISTRATION_HUB_SOURCES_INTRO =
  "Use these follow-ups when configuration browsing turns into readiness checks, activity records, or governance triage.";


/** Operator Sources — no self-href to the Settings hub. */
export const ADMINISTRATION_HUB_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Users and roles", href: "/administration/users" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
] as const;
