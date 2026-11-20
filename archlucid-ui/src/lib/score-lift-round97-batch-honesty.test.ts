import { describe, expect, it } from "vitest";
import { COMPARE_EXPORT_DOCX_STALE_INPUTS_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-export-docx-stale-inputs-not-load-failure-copy";
import { COMPARE_MANIFEST_EXPORT_STALE_INPUTS_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-manifest-export-stale-inputs-not-load-failure-copy";
import { COMPARE_DRIFT_DOWNLOAD_HARD_FAILURE_NOT_EMPTY_ARTIFACT_LINE } from "@/lib/architecture/compare-drift-download-hard-failure-not-empty-artifact-copy";
import { COMPARE_AI_MALFORMED_NOT_BLOCKED_EXPLAIN_LINE } from "@/lib/architecture/compare-ai-malformed-not-blocked-explain-copy";

describe("score-lift round97 batch honesty", () => {
  it("docx stale, manifest stale, drift hard failure, ai malformed", () => {
    expect(COMPARE_EXPORT_DOCX_STALE_INPUTS_NOT_LOAD_FAILURE_LINE).toContain("DOCX");
    expect(COMPARE_MANIFEST_EXPORT_STALE_INPUTS_NOT_LOAD_FAILURE_LINE).toContain("Manifest");
    expect(COMPARE_DRIFT_DOWNLOAD_HARD_FAILURE_NOT_EMPTY_ARTIFACT_LINE).toContain("Drift");
    expect(COMPARE_AI_MALFORMED_NOT_BLOCKED_EXPLAIN_LINE).toContain("contract parsing");
  });
});
