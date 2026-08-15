import { afterEach, describe, expect, it } from "vitest";

import {
  canConfirmFindingApplyChange,
  findingApplyChangePreviewHref,
  hasCompletedFindingApplyChangePreview,
  isFindingApplyChangeDisposition,
  recordFindingApplyChangePreviewCompleted,
} from "@/lib/findings/finding-apply-change-preview-gate";

describe("finding-apply-change-preview-gate", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("treats Remediated as apply-change and Accepted as residual-risk", () => {
    expect(isFindingApplyChangeDisposition("Remediated")).toBe(true);
    expect(isFindingApplyChangeDisposition("Accepted")).toBe(false);
  });

  it("blocks apply-change confirm until a preview is recorded or overridden", () => {
    expect(
      canConfirmFindingApplyChange({ runId: "run-1", findingId: "f-1", overrideRecorded: false }),
    ).toBe(false);

    recordFindingApplyChangePreviewCompleted("run-1", "f-1");

    expect(hasCompletedFindingApplyChangePreview("run-1", "f-1")).toBe(true);
    expect(
      canConfirmFindingApplyChange({ runId: "run-1", findingId: "f-1", overrideRecorded: false }),
    ).toBe(true);
    expect(
      canConfirmFindingApplyChange({ runId: "run-2", findingId: "f-2", overrideRecorded: true }),
    ).toBe(true);
  });

  it("deep-links impact preview with this review as baseline", () => {
    expect(findingApplyChangePreviewHref("run-1", "f-9")).toBe(
      "/insights/impact-preview?baselineRunId=run-1&findingId=f-9",
    );
  });
});
