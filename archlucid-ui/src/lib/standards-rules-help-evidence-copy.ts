import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  STANDARDS_RULES_CLAIM_DISCIPLINE,
  STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_SOURCES_INTRO,
} from "@/lib/standards-rules-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const STANDARDS_RULES_HELP_CANONICAL_PATH = "/help/standards-and-rules" as const;

export const STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING = STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING;

export const STANDARDS_RULES_HELP_CLAIM_DISCIPLINE = STANDARDS_RULES_CLAIM_DISCIPLINE;

export const SECURENOW_STANDARDS_RULES_HELP_CLAIM_DISCIPLINE =
  "Standards and rules shows effective policy resolution rows for the active workspace scope — not a sealed evidence package on its own. Export a diagnostic report when you need a citeable snapshot, then open Findings or Policy packs for follow-up.";

export const STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const STANDARDS_RULES_HELP_SOURCES_INTRO = STANDARDS_RULES_SOURCES_INTRO;

export const SECURENOW_STANDARDS_RULES_HELP_SOURCES_INTRO =
  "Use these follow-ups when effective rules, conflicts, or precedence questions turn into pack assignment or findings triage.";

/** Help follow-ups — no self-href; policy packs help only (governance path lives on the definition tile). */
export const STANDARDS_RULES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Standards & rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Finalized review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

export const SECURENOW_STANDARDS_RULES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Standards and rules", href: SECURENOW_STANDARDS_AND_RULES_PATH },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Policy packs", href: SECURENOW_POLICY_PACKS_PATH },
  { label: "Findings", href: SECURENOW_FINDINGS_PATH },
] as const;

const STANDARDS_RULES_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
]);

const SECURENOW_STANDARDS_RULES_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  SECURENOW_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
]);

/** Orientation-strip Sources — excludes header CTA and definition-tile destinations already above the fold. */
export const STANDARDS_RULES_HELP_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  STANDARDS_RULES_HELP_SOURCES.filter(
    (source) => !STANDARDS_RULES_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );

export function resolveStandardsRulesHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_STANDARDS_RULES_HELP_CLAIM_DISCIPLINE
    : STANDARDS_RULES_HELP_CLAIM_DISCIPLINE;
}

export function resolveStandardsRulesHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_STANDARDS_RULES_HELP_SOURCES_INTRO
    : STANDARDS_RULES_HELP_SOURCES_INTRO;
}

export function resolveStandardsRulesHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_STANDARDS_RULES_HELP_SOURCES : STANDARDS_RULES_HELP_SOURCES;
}

export function resolveStandardsRulesHelpOrientationSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  const sources = resolveStandardsRulesHelpSources(productLineId);
  const excluded =
    isSecureNowProductLine(productLineId)
      ? SECURENOW_STANDARDS_RULES_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS
      : STANDARDS_RULES_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS;

  return sources.filter((source) => !excluded.has(source.href));
}
