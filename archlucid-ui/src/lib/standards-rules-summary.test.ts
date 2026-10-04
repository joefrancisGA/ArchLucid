import { describe, expect, it } from "vitest";

import {
  STANDARDS_RULES_EVIDENCE_COVERAGE_NOT_IN_SCOPE,
  buildStandardsRulesSummary,
} from "@/lib/standards-rules-summary";

describe("buildStandardsRulesSummary", () => {
  it("does not show 0% evidence coverage when no rules are in scope", () => {
    const summary = buildStandardsRulesSummary([]);

    expect(summary.evidenceCoverageLabel).toBe(STANDARDS_RULES_EVIDENCE_COVERAGE_NOT_IN_SCOPE);
  });
});
