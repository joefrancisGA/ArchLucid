import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";
import { standardsRuleHasEvidence } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_EVIDENCE_EVIDENCED_LABEL,
  STANDARDS_RULES_EVIDENCE_NOT_EVIDENCED_LABEL,
} from "@/lib/standards-rules-page";
import { cn } from "@/lib/utils";

/** Fixed body-scale inline links for GRS table, context row, and banner actions. */
export const STANDARDS_RULES_INLINE_LINK_CLASS = cn(OPERATOR_TYPE_SCALE.body, OPERATOR_LINK.inline);

function normalizeEnforcementMode(enforcementMode: string): string {
  return enforcementMode.trim().toLowerCase();
}

export function isRequiredStandardsRuleEnforcement(enforcementMode: string): boolean {
  const normalized = normalizeEnforcementMode(enforcementMode);

  return normalized === "required" || normalized === "mandatory" || normalized === "blocking";
}

/** Maps policy enforcement mode strings to enterprise status tag semantics. */
export function standardsRuleEnforcementStatusKind(enforcementMode: string): EnterpriseStatusKind {
  if (isRequiredStandardsRuleEnforcement(enforcementMode)) {
    return "ready";
  }

  const normalized = normalizeEnforcementMode(enforcementMode);

  if (normalized === "advisory" || normalized === "optional" || normalized === "informational") {
    return "neutral";
  }

  return "neutral";
}

export function standardsRuleEvidenceStatusKind(row: StandardsRuleRow): EnterpriseStatusKind {
  if (standardsRuleHasEvidence(row)) {
    return "ready";
  }

  if (isRequiredStandardsRuleEnforcement(row.enforcementMode)) {
    return "needs-attention";
  }

  return "neutral";
}

export function standardsRuleEvidenceStatusLabel(row: StandardsRuleRow): string {
  if (standardsRuleHasEvidence(row)) {
    return STANDARDS_RULES_EVIDENCE_EVIDENCED_LABEL;
  }

  return STANDARDS_RULES_EVIDENCE_NOT_EVIDENCED_LABEL;
}

export function standardsRulesFiltersAreActive(
  filters: {
    readonly searchQuery: string;
    readonly standardFramework: string;
    readonly severity: string;
    readonly enforcementMode: string;
    readonly sourcePolicyPack: string;
    readonly linkedFindings: string;
    readonly evidenceCoverage: string;
  },
): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.standardFramework !== "all" ||
    filters.severity !== "all" ||
    filters.enforcementMode !== "all" ||
    filters.sourcePolicyPack !== "all" ||
    filters.linkedFindings !== "all" ||
    filters.evidenceCoverage !== "all"
  );
}
