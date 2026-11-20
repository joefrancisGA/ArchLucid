import { describe, expect, it } from "vitest";
import { COMPARE_WORKSPACE_UNSEALED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-workspace-unsealed-not-load-failure-copy";
import { COMPARE_AI_EXPLAIN_BLOCKED_NOT_EMPTY_NARRATIVE_LINE } from "@/lib/architecture/compare-ai-explain-blocked-not-empty-narrative-copy";
import { COMPARE_EXPORT_PDF_STALE_INPUTS_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-export-pdf-stale-inputs-not-load-failure-copy";
import { COMPARE_CORRELATION_SOFT_FAILURE_NOT_EMPTY_METADATA_LINE } from "@/lib/architecture/compare-correlation-soft-failure-not-empty-metadata-copy";

describe("score-lift round96 batch honesty", () => {
  it("workspace unsealed, ai explain blocked, pdf stale, correlation soft failure", () => {
    expect(COMPARE_WORKSPACE_UNSEALED_NOT_LOAD_FAILURE_LINE).toContain("sealed");
    expect(COMPARE_AI_EXPLAIN_BLOCKED_NOT_EMPTY_NARRATIVE_LINE).toContain("blocked");
    expect(COMPARE_EXPORT_PDF_STALE_INPUTS_NOT_LOAD_FAILURE_LINE).toContain("PDF");
    expect(COMPARE_CORRELATION_SOFT_FAILURE_NOT_EMPTY_METADATA_LINE).toContain("correlation");
  });
});
