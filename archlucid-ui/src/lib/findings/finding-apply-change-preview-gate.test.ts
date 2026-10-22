import { afterEach, describe, expect, it } from "vitest";

import {
  buildFindingApplyChangeDispositionAttestation,
  canConfirmFindingApplyChange,
  findingApplyChangePreviewHref,
  FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL,
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

  it("blocks apply-change confirm until a preview is recorded or overridden on Guided", () => {
    expect(
      canConfirmFindingApplyChange({
        isWorkingDesk: false,
        runId: "run-1",
        findingId: "f-1",
        overrideRecorded: false,
      }),
    ).toBe(false);

    recordFindingApplyChangePreviewCompleted("run-1", "f-1");

    expect(hasCompletedFindingApplyChangePreview("run-1", "f-1")).toBe(true);
    expect(
      canConfirmFindingApplyChange({
        isWorkingDesk: false,
        runId: "run-1",
        findingId: "f-1",
        overrideRecorded: false,
      }),
    ).toBe(true);
    expect(
      canConfirmFindingApplyChange({
        isWorkingDesk: false,
        runId: "run-2",
        findingId: "f-2",
        overrideRecorded: true,
      }),
    ).toBe(true);
  });

  it("LP-14: Working sessionStorage alone is insufficient without server attestation payload", () => {
    recordFindingApplyChangePreviewCompleted("run-1", "f-1");

    expect(
      buildFindingApplyChangeDispositionAttestation({
        isWorkingDesk: true,
        runId: "run-1",
        findingId: "f-1",
        overrideRecorded: false,
      }),
    ).toEqual({ impactPreviewCompleted: true });

    expect(
      buildFindingApplyChangeDispositionAttestation({
        isWorkingDesk: true,
        runId: "run-9",
        findingId: "f-9",
        overrideRecorded: false,
      }),
    ).toBeNull();
  });

  it("LP-14: Working override builds previewOverrideReason attestation", () => {
    expect(
      buildFindingApplyChangeDispositionAttestation({
        isWorkingDesk: true,
        runId: "run-1",
        findingId: "f-1",
        overrideRecorded: true,
      }),
    ).toEqual({ previewOverrideReason: FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL });
  });

  it("deep-links impact preview with this review as baseline", () => {
    expect(findingApplyChangePreviewHref("run-1", "f-9")).toBe(
      "/insights/impact-preview?baselineRunId=run-1&findingId=f-9",
    );
  });
});
