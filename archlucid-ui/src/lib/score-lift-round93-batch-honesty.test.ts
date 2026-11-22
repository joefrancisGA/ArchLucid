import { describe, expect, it } from "vitest";
import { COMPARE_RUN_PICKERS_SAME_REVIEW_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-run-pickers-same-review-not-load-failure-copy";
import { COMPARE_SEARCH_BLOCKED_NOT_EMPTY_COMPARE_LINE } from "@/lib/architecture/compare-search-blocked-not-empty-compare-copy";
import { COMPARE_PAIR_BLOCKED_AGGREGATE_NOT_EMPTY_COMPARE_LINE } from "@/lib/architecture/compare-pair-blocked-aggregate-not-empty-compare-copy";
import { COMPARE_EXPORT_PDF_BLOCKED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-export-pdf-blocked-not-load-failure-copy";

describe("score-lift round93 batch honesty", () => {
  it("same review, search blocked, pair blocked aggregate, pdf export blocked", () => {
    expect(COMPARE_RUN_PICKERS_SAME_REVIEW_NOT_LOAD_FAILURE_LINE).toContain("same review");
    expect(COMPARE_SEARCH_BLOCKED_NOT_EMPTY_COMPARE_LINE).toContain("blocked");
    expect(COMPARE_PAIR_BLOCKED_AGGREGATE_NOT_EMPTY_COMPARE_LINE).toContain("gates");
    expect(COMPARE_EXPORT_PDF_BLOCKED_NOT_LOAD_FAILURE_LINE).toContain("PDF");
  });
});
