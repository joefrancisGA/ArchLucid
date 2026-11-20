import { describe, expect, it } from "vitest";
import { COMPARE_TRUST_BANNER_CURRENT_EFFECTIVE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-trust-banner-current-effective-unsealed-not-load-failure-copy";
import { COMPARE_LIVE_REGION_STALE_INPUTS_ANNOUNCEMENT } from "@/lib/architecture/compare-live-region-stale-inputs-copy";
import { COMPARE_STRUCTURED_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-structured-diff-empty-not-load-failure-copy";
import { COMPARE_RAW_MANIFEST_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-raw-manifest-diff-empty-not-load-failure-copy";

describe("score-lift round92 batch honesty", () => {
  it("trust banner, live region, structured empty, raw manifest empty", () => {
    expect(COMPARE_TRUST_BANNER_CURRENT_EFFECTIVE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_LIVE_REGION_STALE_INPUTS_ANNOUNCEMENT).toContain("Compare");
    expect(COMPARE_STRUCTURED_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("empty");
    expect(COMPARE_RAW_MANIFEST_DIFF_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("diff");
  });
});
