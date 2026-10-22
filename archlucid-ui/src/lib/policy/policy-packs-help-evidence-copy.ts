import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { POLICY_PACKS_HELP_PATH } from "@/lib/policy/policy-packs-page";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const POLICY_PACKS_HELP_CANONICAL_PATH = POLICY_PACKS_HELP_PATH;

export const POLICY_PACKS_HELP_TOPIC_LABEL = "How policy packs work" as const;

export const POLICY_PACKS_HELP_PRIMARY_ACTION = {
  label: "Open Policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  testId: "help-policy-packs-open-policy-packs",
} as const;

export const POLICY_PACKS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const POLICY_PACKS_HELP_CLAIM_DISCIPLINE =
  "This guide orients architects on pack assignment and conflict resolution — open Policy packs or Standards and rules when you need live pack and rule state.";

export const SECURENOW_POLICY_PACKS_HELP_CLAIM_DISCIPLINE =
  "This guide orients operators on ARC-AMPE pack assignment and priority floors — open Policy packs, Standards and rules, or Findings when you need live assignments and violations.";

export const POLICY_PACKS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const POLICY_PACKS_HELP_CLAIM_HEADING_ID = "help-policy-packs-claim-discipline-heading" as const;

export const POLICY_PACKS_HELP_SOURCES_INTRO =
  "Use these follow-ups when pack vocabulary turns into live assignments, conflict resolution, findings triage, or SE demo rehearsal.";

export const SECURENOW_POLICY_PACKS_HELP_SOURCES_INTRO =
  "Use these follow-ups when pack assignment turns into effective rules, findings triage, or inventory evidence.";

/** Operator Sources — no self-href to `/help/policy-packs`. */
export const POLICY_PACKS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Standards and rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Policy-pack delta demo", href: POLICY_PACK_DELTA_DEMO_HELP_PATH },
] as const;

export const SECURENOW_POLICY_PACKS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: SECURENOW_POLICY_PACKS_PATH },
  { label: "Standards and rules", href: SECURENOW_STANDARDS_AND_RULES_PATH },
  { label: "Findings", href: SECURENOW_FINDINGS_PATH },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
] as const;

export function resolvePolicyPacksHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_POLICY_PACKS_HELP_CLAIM_DISCIPLINE
    : POLICY_PACKS_HELP_CLAIM_DISCIPLINE;
}

export function resolvePolicyPacksHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_POLICY_PACKS_HELP_SOURCES_INTRO
    : POLICY_PACKS_HELP_SOURCES_INTRO;
}

export function resolvePolicyPacksHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_POLICY_PACKS_HELP_SOURCES : POLICY_PACKS_HELP_SOURCES;
}
