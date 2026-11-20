import { describe, expect, it } from "vitest";
import { COMPARE_END_TO_END_EXPORT_BLOCKED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-end-to-end-export-blocked-not-load-failure-copy";
import { COMPARE_END_TO_END_EXPORT_STALE_INPUTS_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-end-to-end-export-stale-inputs-not-load-failure-copy";
import { COMPARE_PAIR_CITE_STRIP_STALE_CURRENT_EFFECTIVE_LINE } from "@/lib/architecture/compare-pair-cite-strip-stale-current-effective-copy";
import { COMPARE_AI_NARRATIVE_MISSING_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-ai-narrative-missing-not-load-failure-copy";

describe("score-lift round95 batch honesty", () => {
  it("end-to-end export, stale inputs, cite strip, ai narrative", () => {
    expect(COMPARE_END_TO_END_EXPORT_BLOCKED_NOT_LOAD_FAILURE_LINE).toContain("End-to-end");
    expect(COMPARE_END_TO_END_EXPORT_STALE_INPUTS_NOT_LOAD_FAILURE_LINE).toContain("drift");
    expect(COMPARE_PAIR_CITE_STRIP_STALE_CURRENT_EFFECTIVE_LINE).toContain("current-effective");
    expect(COMPARE_AI_NARRATIVE_MISSING_NOT_LOAD_FAILURE_LINE).toContain("narrative");
  });
});
