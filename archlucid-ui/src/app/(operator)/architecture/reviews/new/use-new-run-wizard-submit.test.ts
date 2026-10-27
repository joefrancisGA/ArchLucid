import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WizardFormValues } from "@/lib/wizard-schema";

import { TRACK_STEP_INDEX } from "./new-run-wizard-steps";
import { useNewRunWizardSubmit } from "./use-new-run-wizard-submit";

const executeWizardFormCreateRun = vi.fn();
const recheckUnresolvedArchitectureReviewCreate = vi.fn();

const creationProgressHarness = vi.hoisted(() => ({
  outcome: null as { kind: "unresolved" } | { kind: "failed"; message: string } | null,
  isActive: false,
  begin: vi.fn(),
  succeed: vi.fn(),
  fail: vi.fn(),
  markUnresolved: vi.fn(),
  beginRecheck: vi.fn(),
  endRecheck: vi.fn(),
  markResumed: vi.fn(),
}));

vi.mock("@/hooks/use-review-creation-progress", () => ({
  useReviewCreationProgress: () => creationProgressHarness,
}));

vi.mock("@/lib/wizard-form-create-run-submit", () => ({
  evaluateWizardFormCreateRunGates: vi.fn(async () => null),
  describeCoveragePackOverrideBlocker: vi.fn(() => null),
  executeWizardFormCreateRun: (...args: unknown[]) => executeWizardFormCreateRun(...args),
}));

vi.mock("@/lib/review-start-unresolved-recheck", () => ({
  recheckUnresolvedArchitectureReviewCreate: (...args: unknown[]) =>
    recheckUnresolvedArchitectureReviewCreate(...args),
}));

vi.mock("@/lib/wizard-payload", () => ({
  wizardValuesToCreateRunPayload: vi.fn(() => ({})),
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
  beforeEach(() => {
    creationProgressHarness.begin.mockClear();
    creationProgressHarness.succeed.mockClear();
    creationProgressHarness.fail.mockClear();
    creationProgressHarness.beginRecheck.mockClear();
    creationProgressHarness.endRecheck.mockClear();
    creationProgressHarness.markResumed.mockClear();
    recheckUnresolvedArchitectureReviewCreate.mockReset();
  });

  it("calls beginRecheck when creation outcome is unresolved", async () => {
    creationProgressHarness.outcome = { kind: "unresolved" };
    recheckUnresolvedArchitectureReviewCreate.mockResolvedValueOnce({ status: "still-unresolved" });

    const { result } = renderHook(() => useNewRunWizardSubmit(buildOptions()));

    await act(async () => {
      await result.current.recheckUnresolvedRun();
    });

    expect(creationProgressHarness.beginRecheck).toHaveBeenCalled();
    expect(recheckUnresolvedArchitectureReviewCreate).toHaveBeenCalled();
    expect(creationProgressHarness.endRecheck).toHaveBeenCalled();
    creationProgressHarness.outcome = null;
  });

  it("still resumes unresolved create when clearing wizard session throws on recheck", async () => {
    creationProgressHarness.outcome = { kind: "unresolved" };
    recheckUnresolvedArchitectureReviewCreate.mockResolvedValueOnce({
      status: "found",
      runId: "run-resumed",
    });
    const clearWizardSession = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    const goToStep = vi.fn();
    const setRunId = vi.fn();

    const { result } = renderHook(() =>
      useNewRunWizardSubmit(
        buildOptions({
          clearWizardSession,
          goToStep,
          setRunId,
          hasPendingEvidence: false,
        }),
      ),
    );

    await act(async () => {
      await result.current.recheckUnresolvedRun();
    });

    expect(creationProgressHarness.beginRecheck).toHaveBeenCalled();
    expect(recheckUnresolvedArchitectureReviewCreate).toHaveBeenCalled();
    expect(creationProgressHarness.fail).not.toHaveBeenCalled();
    expect(creationProgressHarness.markResumed).toHaveBeenCalled();
    expect(setRunId).toHaveBeenCalledWith("run-resumed");
    expect(goToStep).toHaveBeenCalledWith(TRACK_STEP_INDEX);
  });

  it("reports recheck failure only when the unresolved replay request throws", async () => {
    creationProgressHarness.outcome = { kind: "unresolved" };
    recheckUnresolvedArchitectureReviewCreate.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useNewRunWizardSubmit(buildOptions({ hasPendingEvidence: false })));

    await act(async () => {
      await result.current.recheckUnresolvedRun();
    });

    expect(creationProgressHarness.fail).toHaveBeenCalled();
    expect(creationProgressHarness.markResumed).not.toHaveBeenCalled();
  });

  it("still reaches track step after successful create when clearing the wizard session throws", async () => {
    const clearWizardSession = vi.fn(() => {
      throw new Error("QuotaExceededError");
    });
    const goToStep = vi.fn();
    const setRunId = vi.fn();

    executeWizardFormCreateRun.mockResolvedValueOnce({ ok: true, runId: "run-abc" });

    const { result } = renderHook(() =>
      useNewRunWizardSubmit(
        buildOptions({
          clearWizardSession,
          goToStep,
          setRunId,
          hasPendingEvidence: false,
        }),
      ),
    );

    await act(async () => {
      await result.current.submitRun();
    });

    expect(creationProgressHarness.succeed).toHaveBeenCalled();
    expect(setRunId).toHaveBeenCalledWith("run-abc");
    expect(goToStep).toHaveBeenCalledWith(TRACK_STEP_INDEX);
  });

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
