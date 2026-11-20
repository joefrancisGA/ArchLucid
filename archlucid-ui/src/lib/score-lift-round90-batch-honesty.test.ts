import { describe, expect, it } from "vitest";
import { COMPARE_ROI_HEADLINE_ZERO_ESTIMATES_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-roi-headline-zero-estimates-one-unsealed-not-load-failure-copy";
import { COMPARE_GATE_OUTCOME_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-gate-outcome-empty-not-load-failure-copy";
import { COMPARE_PACK_ASSIGNMENT_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-pack-assignment-empty-not-load-failure-copy";
import { COMPARE_CORRELATION_EMPTY_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-correlation-empty-one-unsealed-not-load-failure-copy";

describe("score-lift round90 batch honesty", () => {
  it("roi headline, gate outcome, pack assignment, correlation unsealed", () => {
    expect(COMPARE_ROI_HEADLINE_ZERO_ESTIMATES_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_GATE_OUTCOME_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("gate");
    expect(COMPARE_PACK_ASSIGNMENT_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("assignment");
    expect(COMPARE_CORRELATION_EMPTY_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("correlation");
  });
});
