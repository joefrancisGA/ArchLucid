import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WizardFormValues } from "@/lib/wizard-schema";

import { TRACK_STEP_INDEX } from "./new-run-wizard-steps";
import { useNewRunWizardSubmit } from "./use-new-run-wizard-submit";

const executeWizardFormCreateRun = vi.fn();

vi.mock("@/lib/wizard-form-create-run-submit", () => ({
  evaluateWizardFormCreateRunGates: vi.fn(async () => null),
  describeCoveragePackOverrideBlocker: vi.fn(() => null),
  executeWizardFormCreateRun: (...args: unknown[]) => executeWizardFormCreateRun(...args),
}));

vi.mock("@/lib/review-start-unresolved-recheck", () => ({
  recheckUnresolvedArchitectureReviewCreate: vi.fn(),
}));

function buildOptions(overrides?: Partial<Parameters<typeof useNewRunWizardSubmit>[0]>) {
  return {
    trigger: vi.fn(async () => true),
    getValues: vi.fn(() => ({}) as WizardFormValues),
    blocksLlmExecution: false,
    payloadOptions: {},
    presetDeeplinkToken: null,
    policyPackCloudMismatch: null,
    stepIndex: 0,
    goToStep: vi.fn(),
    setRunId: vi.fn(),
    setStepValidationMessage: vi.fn(),
    clearWizardSession: vi.fn(),
    hasPendingEvidence: true,
    uploadPendingEvidence: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("useNewRunWizardSubmit", () => {
  it("awaits pending evidence upload after clearing wizard session storage", async () => {
    const callOrder: string[] = [];
    const clearWizardSession = vi.fn(() => {
      callOrder.push("clear");
    });
    const uploadPendingEvidence = vi.fn(async () => {
      callOrder.push("upload");
    });
    const goToStep = vi.fn();
    const setRunId = vi.fn();

    executeWizardFormCreateRun.mockResolvedValueOnce({ ok: true, runId: "run-abc" });

    const { result } = renderHook(() =>
      useNewRunWizardSubmit(
        buildOptions({
          clearWizardSession,
          uploadPendingEvidence,
          goToStep,
          setRunId,
        }),
      ),
    );

    await act(async () => {
      await result.current.submitRun();
    });

    expect(setRunId).toHaveBeenCalledWith("run-abc");
    expect(goToStep).toHaveBeenCalledWith(TRACK_STEP_INDEX);
    expect(clearWizardSession).toHaveBeenCalledTimes(1);
    expect(uploadPendingEvidence).toHaveBeenCalledWith("run-abc");
    expect(callOrder).toEqual(["clear", "upload"]);
  });

  it("still awaits pending evidence upload when upload fails after clearWizardSession", async () => {
    const uploadPendingEvidence = vi.fn(async () => {
      throw new Error("upload failed");
    });

    executeWizardFormCreateRun.mockResolvedValueOnce({ ok: true, runId: "run-abc" });

    const { result } = renderHook(() =>
      useNewRunWizardSubmit(
        buildOptions({
          uploadPendingEvidence,
        }),
      ),
    );

    await expect(act(async () => {
      await result.current.submitRun();
    })).rejects.toThrow("upload failed");

    expect(uploadPendingEvidence).toHaveBeenCalledWith("run-abc");
  });
});
