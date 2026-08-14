import { describe, expect, it } from "vitest";

import {
  buildStandardsRuleRows,
  buildStandardsRulesSummary,
  filterStandardsRuleRows,
  EMPTY_STANDARDS_RULES_FILTER_STATE,
} from "@/lib/standards-rules-rows";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

const emptyData: EffectiveGovernanceResolutionResult = {
  tenantId: "demo",
  workspaceId: "demo",
  projectId: "default",
  effectiveContent: {
    complianceRuleIds: [],
    complianceRuleKeys: [],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: {},
  },
  decisions: [],
  conflicts: [],
  notes: [],
};

describe("buildStandardsRuleRows", () => {
  it("returns showcase rules in buyer fallback mode", () => {
    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });

    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows.some((row) => row.ruleName === "PHI minimization required")).toBe(true);
    expect(rows.some((row) => row.ruleName === "IRS 1075 access logging")).toBe(true);
  });

  it("maps API compliance rule keys to presentation rows", () => {
    const rows = buildStandardsRuleRows({
      ...emptyData,
      effectiveContent: {
        ...emptyData.effectiveContent,
        complianceRuleKeys: ["phi.minimization.intake"],
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.ruleName).toBe("PHI minimization required");
    expect(rows[0]?.linkedFindingsHref).toContain("/governance/findings");
  });
});

describe("filterStandardsRuleRows", () => {
  it("filters by severity and linked findings", () => {
    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });
    const highSeverity = filterStandardsRuleRows(rows, {
      ...EMPTY_STANDARDS_RULES_FILTER_STATE,
      severity: "High",
    });
    const linkedOnly = filterStandardsRuleRows(rows, {
      ...EMPTY_STANDARDS_RULES_FILTER_STATE,
      linkedFindings: "linked",
    });

    expect(highSeverity.every((row) => row.severity === "High")).toBe(true);
    expect(linkedOnly.every((row) => row.linkedFindingsHref !== null)).toBe(true);
  });
});

describe("buildStandardsRulesSummary", () => {
  it("counts unique standards, linked findings, and evidence coverage", () => {
    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });
    const summary = buildStandardsRulesSummary(rows);

    expect(summary.rulesEnforced).toBe(rows.length);
    expect(summary.standardsInScope).toBeGreaterThan(0);
    expect(summary.rulesWithLinkedFindings).toBeGreaterThan(0);
    expect(summary.evidencedRules).toBeGreaterThan(0);
    expect(summary.evidencedRules).toBeLessThan(rows.length);
    expect(summary.evidenceCoverageLabel).toMatch(/%$/);
  });
});
