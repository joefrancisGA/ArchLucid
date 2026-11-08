import { describe, expect, it } from "vitest";

import {
  COMPARE_AI_EXPLANATION_COST_DELTA_NOT_STORED,
  COMPARE_AI_EXPLANATION_SECURITY_DELTA_NOT_STORED,
  formatCompareAiExplanationCostDeltaHonesty,
  formatCompareAiExplanationSecurityDeltaHonesty,
} from "@/lib/compare/compare-ai-explanation-structured-honesty";

describe("compare-ai-explanation-structured-honesty (P-05, P-06)", () => {
  it("labels omitted structured security and cost delta counts", () => {
    expect(formatCompareAiExplanationSecurityDeltaHonesty(null)).toBe(
      COMPARE_AI_EXPLANATION_SECURITY_DELTA_NOT_STORED,
    );
    expect(formatCompareAiExplanationCostDeltaHonesty(undefined)).toBe(
      COMPARE_AI_EXPLANATION_COST_DELTA_NOT_STORED,
    );
  });

  it("uses zero and plural phrasing when counts are stored", () => {
    expect(formatCompareAiExplanationSecurityDeltaHonesty(0)).toContain("0 security");
    expect(formatCompareAiExplanationCostDeltaHonesty(2)).toContain("2 modeled cost");
  });
});
