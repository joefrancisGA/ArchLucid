import { describe, expect, it } from "vitest";

import { EMPTY_STANDARDS_RULES_FILTER_STATE } from "@/lib/standards-rules-rows";
import {
  standardsRuleEnforcementStatusKind,
  standardsRulesFiltersAreActive,
} from "@/lib/standards-rules-table-presentation";

describe("standardsRuleEnforcementStatusKind", () => {
  it("maps required enforcement to attention semantics", () => {
    expect(standardsRuleEnforcementStatusKind("Required")).toBe("needs-attention");
  });

  it("maps advisory enforcement to neutral semantics", () => {
    expect(standardsRuleEnforcementStatusKind("Advisory")).toBe("neutral");
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
        severity: "High",
      }),
    ).toBe(true);
  });
});
