import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import {
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const FINDINGS_HELP_CANONICAL_PATH = FINDINGS_HELP_PATH;

export const FINDINGS_HELP_TOPIC_LABEL = "How findings work";

export const FINDINGS_HELP_CLAIM_DISCIPLINE =
  "This findings guide explains how architecture concerns are inspected and resolved — it is not a sealed-review diligence Sources package. Open Findings, Audit, or a finalized architecture review when you need live or governed trails.";

export const FINDINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a finding needs live triage, evidence search, governance decisions, or product orientation.";


/** Operator Sources — no self-href to `/help/findings`. */
export const FINDINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
