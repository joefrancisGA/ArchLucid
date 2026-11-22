import { describe, expect, it } from "vitest";
import { COMPARE_SEMANTIC_SUPPORT_BAND_ZERO_COUNTS_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-semantic-support-band-zero-counts-one-unsealed-not-load-failure-copy";
import { COMPARE_TREATMENT_BAND_ZERO_COUNTS_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-treatment-band-zero-counts-one-unsealed-not-load-failure-copy";
import { COMPARE_GOVERNANCE_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-governance-diff-empty-not-load-failure-copy";
import { COMPARE_RESULTS_STALE_INPUTS_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-results-stale-inputs-not-load-failure-copy";

describe("score-lift round89 batch honesty", () => {
  it("semantic support, treatment, governance diff empty, stale inputs", () => {
    expect(COMPARE_SEMANTIC_SUPPORT_BAND_ZERO_COUNTS_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_TREATMENT_BAND_ZERO_COUNTS_ONE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_GOVERNANCE_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("Governance");
    expect(COMPARE_RESULTS_STALE_INPUTS_NOT_LOAD_FAILURE_LINE).toContain("Compare");
  });
});
