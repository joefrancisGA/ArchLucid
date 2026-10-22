export type HealthcareClaimsPolicyPackRuleRow = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly severity: "High" | "Medium" | "Low";
  readonly requirement: string;
  readonly evidenceExpected: string;
};

export const HEALTHCARE_CLAIMS_POLICY_PACK_RULE_ROWS: readonly HealthcareClaimsPolicyPackRuleRow[] = [
  {
    ruleKey: "phi-minimization",
    ruleName: "PHI minimization on intake APIs",
    severity: "High",
    requirement: "Identifiers crossing trust boundaries must be minimized and justified.",
    evidenceExpected: "Finalized review record excerpt and data-flow diagram",
  },
  {
    ruleKey: "lineage-provenance",
    ruleName: "Finding lineage and provenance",
    severity: "High",
    requirement: "Findings must retain review record version and approval linkage.",
    evidenceExpected: "Sealed review record and governance approval row",
  },
  {
    ruleKey: "retention-window",
    ruleName: "Retention window enforcement",
    severity: "Medium",
    requirement: "PHI-bearing fields must not persist beyond necessary retention windows.",
    evidenceExpected: "Configuration snapshot and retention policy citation",
  },
  {
    ruleKey: "drift-monitoring",
    ruleName: "Operational drift monitoring",
    severity: "Medium",
    requirement: "Unstructured attachment spikes must surface on the findings queue.",
    evidenceExpected: "Operational security finding with drift correlation",
  },
];
