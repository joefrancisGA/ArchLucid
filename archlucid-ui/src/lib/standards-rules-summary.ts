import {
  collectContributingPolicyPacks,
  standardsRuleHasEvidence,
  type StandardsRuleRow,
  type StandardsRulesContributingPolicyPack,
} from "./standards-rules-rows-build";

export type StandardsRulesSummary = {
  readonly standardsInScope: number;
  readonly rulesEnforced: number;
  readonly rulesWithLinkedFindings: number;
  readonly evidencedRules: number;
  readonly evidenceCoverageLabel: string;
  readonly contributingPolicyPacks: readonly StandardsRulesContributingPolicyPack[];
};

export function buildStandardsRulesSummary(rows: readonly StandardsRuleRow[]): StandardsRulesSummary {
  const standards = new Set(rows.map((row) => row.standardFramework));
  const rulesWithLinkedFindings = rows.filter((row) => row.linkedFindingsHref !== null).length;
  const evidencedRules = rows.filter((row) => standardsRuleHasEvidence(row)).length;
  const evidenceCoverageLabel =
    rows.length === 0 ? "0%" : `${Math.round((evidencedRules / rows.length) * 100)}%`;

  return {
    standardsInScope: standards.size,
    rulesEnforced: rows.length,
    rulesWithLinkedFindings,
    evidencedRules,
    evidenceCoverageLabel,
    contributingPolicyPacks: collectContributingPolicyPacks(rows),
  };
}

export type StandardsRulesFilterState = {
  readonly searchQuery: string;
  readonly standardFramework: string;
  readonly severity: string;
  readonly enforcementMode: string;
  readonly sourcePolicyPack: string;
  readonly linkedFindings: "all" | "linked" | "unlinked";
  readonly evidenceCoverage: "all" | "evidenced" | "unevidenced";
};

export const EMPTY_STANDARDS_RULES_FILTER_STATE: StandardsRulesFilterState = {
  searchQuery: "",
  standardFramework: "all",
  severity: "all",
  enforcementMode: "all",
  sourcePolicyPack: "all",
  linkedFindings: "all",
  evidenceCoverage: "all",
};

export function filterStandardsRuleRows(
  rows: readonly StandardsRuleRow[],
  filters: StandardsRulesFilterState,
): readonly StandardsRuleRow[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    if (query.length > 0) {
      const haystack = [
        row.ruleName,
        row.standardFramework,
        row.category,
        row.severity,
        row.enforcementMode,
        row.sourcePolicyPack,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.standardFramework !== "all" && row.standardFramework !== filters.standardFramework) {
      return false;
    }

    if (filters.severity !== "all" && row.severity !== filters.severity) {
      return false;
    }

    if (filters.enforcementMode !== "all" && row.enforcementMode !== filters.enforcementMode) {
      return false;
    }

    if (filters.sourcePolicyPack !== "all" && row.sourcePolicyPack !== filters.sourcePolicyPack) {
      return false;
    }

    if (filters.linkedFindings === "linked" && row.linkedFindingsHref === null) {
      return false;
    }

    if (filters.linkedFindings === "unlinked" && row.linkedFindingsHref !== null) {
      return false;
    }

    if (filters.evidenceCoverage === "evidenced" && !standardsRuleHasEvidence(row)) {
      return false;
    }

    if (filters.evidenceCoverage === "unevidenced" && standardsRuleHasEvidence(row)) {
      return false;
    }

    return true;
  });
}

export function collectStandardsRulesFilterOptions(rows: readonly StandardsRuleRow[]): {
  readonly standards: readonly string[];
  readonly severities: readonly string[];
  readonly enforcementModes: readonly string[];
  readonly policyPacks: readonly string[];
} {
  return {
    standards: [...new Set(rows.map((row) => row.standardFramework))].sort(),
    severities: [...new Set(rows.map((row) => row.severity))].sort(),
    enforcementModes: [...new Set(rows.map((row) => row.enforcementMode))].sort(),
    policyPacks: [...new Set(rows.map((row) => row.sourcePolicyPack))].sort(),
  };
}
