import { describe, expect, it } from "vitest";
import { COMPARE_EXPORT_DOCX_BLOCKED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-export-docx-blocked-not-load-failure-copy";
import { COMPARE_DRIFT_DOWNLOAD_BLOCKED_NOT_EMPTY_COMPARE_LINE } from "@/lib/architecture/compare-drift-download-blocked-not-empty-compare-copy";
import { COMPARE_INSUFFICIENT_FINALIZED_ZERO_FINALIZED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-insufficient-finalized-zero-finalized-not-load-failure-copy";
import { COMPARE_MANIFEST_EXPORT_BLOCKED_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-manifest-export-blocked-not-load-failure-copy";

describe("score-lift round94 batch honesty", () => {
  it("docx blocked, drift blocked, zero finalized, manifest export blocked", () => {
    expect(COMPARE_EXPORT_DOCX_BLOCKED_NOT_LOAD_FAILURE_LINE).toContain("DOCX");
    expect(COMPARE_DRIFT_DOWNLOAD_BLOCKED_NOT_EMPTY_COMPARE_LINE).toContain("Drift");
    expect(COMPARE_INSUFFICIENT_FINALIZED_ZERO_FINALIZED_NOT_LOAD_FAILURE_LINE).toContain("finalized");
    expect(COMPARE_MANIFEST_EXPORT_BLOCKED_NOT_LOAD_FAILURE_LINE).toContain("Markdown");
  });
});
