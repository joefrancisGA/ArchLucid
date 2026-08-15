import { describe, expect, it } from "vitest";

import { EMPTY_STANDARDS_RULES_FILTER_STATE } from "@/lib/standards-rules-rows";
import {
  isRequiredStandardsRuleEnforcement,
  standardsRuleEnforcementStatusKind,
  standardsRuleEvidenceStatusKind,
  standardsRuleEvidenceStatusLabel,
  standardsRulesFiltersAreActive,
} from "@/lib/standards-rules-table-presentation";
import { buildStandardsRuleRows } from "@/lib/standards-rules-rows";
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

describe("standardsRuleEnforcementStatusKind", () => {
  it("maps required enforcement to ready semantics", () => {
    expect(standardsRuleEnforcementStatusKind("Required")).toBe("ready");
    expect(isRequiredStandardsRuleEnforcement("mandatory")).toBe(true);
  });

  it("maps advisory enforcement to neutral semantics", () => {
    expect(standardsRuleEnforcementStatusKind("Advisory")).toBe("neutral");
  });
});

describe("standardsRuleEvidenceStatusKind", () => {
  it("flags required rules without evidence as needs-attention", () => {
    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });
    const unevidencedRequired = rows.find((row) => row.evidenceHref === null && row.enforcementMode === "Required");

    expect(unevidencedRequired).toBeDefined();
    expect(standardsRuleEvidenceStatusKind(unevidencedRequired!)).toBe("needs-attention");
    expect(standardsRuleEvidenceStatusLabel(unevidencedRequired!)).toBe("Not evidenced");
  });

  it("marks evidenced rules as ready", () => {
    const rows = buildStandardsRuleRows(emptyData, { useShowcaseFallback: true });
    const evidenced = rows.find((row) => row.evidenceHref !== null);

    expect(evidenced).toBeDefined();
    expect(standardsRuleEvidenceStatusKind(evidenced!)).toBe("ready");
    expect(standardsRuleEvidenceStatusLabel(evidenced!)).toBe("Evidenced");
  });
});

describe("standardsRulesFiltersAreActive", () => {
  it("returns false for the empty filter state", () => {
    expect(standardsRulesFiltersAreActive(EMPTY_STANDARDS_RULES_FILTER_STATE)).toBe(false);
  });

  it("returns true when any filter diverges from defaults", () => {
    expect(
      standardsRulesFiltersAreActive({
        ...EMPTY_STANDARDS_RULES_FILTER_STATE,
        evidenceCoverage: "unevidenced",
      }),
    ).toBe(true);
  });
});
