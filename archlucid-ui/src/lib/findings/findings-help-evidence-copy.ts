import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import {
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FINDINGS_HELP_CANONICAL_PATH = FINDINGS_HELP_PATH;

export const FINDINGS_HELP_TOPIC_LABEL = "How findings work";

export const FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const FINDINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how architecture concerns are inspected and resolved — open Findings, Audit, or a finalized architecture review when you need live records or export-ready activity. Semantic support chips are not legal truth; Record finalize in Real may rescore Unchecked rows, and the band does not block seal.";

export const SECURENOW_FINDINGS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how cloud security findings are inspected and resolved — open Findings, Audit evidence lineage, or inventory exports when you need live records or sealed evidence packages. Semantic support chips are not legal truth; they describe excerpt support and do not replace disposition accountability.";

export const FINDINGS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const FINDINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a finding needs live triage, evidence search, approval decisions, or product orientation.";

export const SECURENOW_FINDINGS_HELP_SOURCES_INTRO =
  "Use these follow-ups when a finding needs live triage, inventory context, policy packs, or product orientation.";

/** Operator Sources — no self-href to `/help/findings`. */
export const FINDINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const SECURENOW_FINDINGS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Resource explorer", href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH },
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export function resolveFindingsHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_FINDINGS_HELP_CLAIM_DISCIPLINE
    : FINDINGS_HELP_CLAIM_DISCIPLINE;
}

export function resolveFindingsHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_FINDINGS_HELP_SOURCES_INTRO
    : FINDINGS_HELP_SOURCES_INTRO;
}

export function resolveFindingsHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_FINDINGS_HELP_SOURCES : FINDINGS_HELP_SOURCES;
}
