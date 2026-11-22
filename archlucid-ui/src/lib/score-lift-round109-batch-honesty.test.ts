import { describe, expect, it } from "vitest";
import { RUN_DETAIL_EVIDENCE_BUNDLE_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-detail-evidence-bundle-export-finalize-not-load-failure-copy";
import { CONSULTING_DOCX_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/exports/consulting-docx-export-finalize-not-load-failure-copy";
import { REVIEW_BOARD_WHITELABEL_CONSULTING_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/exports/review-board-whitelabel-consulting-export-finalize-not-load-failure-copy";
import { RUN_SCOPED_AUDIT_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-scoped-audit-export-finalize-not-load-failure-copy";

describe("score-lift round109 batch honesty", () => {
  it("evidence bundle, consulting docx, whitelabel docx, run scoped audit", () => {
    expect(RUN_DETAIL_EVIDENCE_BUNDLE_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(CONSULTING_DOCX_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(REVIEW_BOARD_WHITELABEL_CONSULTING_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RUN_SCOPED_AUDIT_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
