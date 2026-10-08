import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const createArchitectureRun = vi.fn();
const uploadWizardPendingDocumentEvidence = vi.fn();
const clearWizardSession = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRun(...args),
}));

vi.mock("@/lib/wizard-pending-evidence-upload", () => ({
  uploadWizardPendingDocumentEvidence: (...args: unknown[]) => uploadWizardPendingDocumentEvidence(...args),
  WIZARD_PENDING_EVIDENCE_UPLOAD_DEFERRED_MESSAGE: "deferred",
}));

vi.mock("@/lib/wizard-form-create-run-submit", () => ({
  describeCoveragePackOverrideBlocker: () => null,
  resolveCreateRunFailureMessage: () => "failed",
}));

vi.mock("@/lib/first-pilot-intake", () => ({
  describeFirstPilotStartBlocker: () => null,
}));

vi.mock("@/lib/persist-run-coverage-acknowledgement", () => ({
  persistSessionRunCoverageAcknowledgement: vi.fn(async () => undefined),
}));

vi.mock("@/lib/operations/review-pipeline-in-flight", () => ({
  reviewPipelineOperationId: () => "op",
  trackReviewPipelineInFlight: vi.fn(),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

import { useFirstPilotIntakeSubmit } from "./use-first-pilot-intake-submit";

function buildCreationProgress() {
  return {
    begin: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    reset: vi.fn(),
    bindOperation: vi.fn(),
    markPreparingQuestions: vi.fn(),
    markOpeningReview: vi.fn(),
    outcome: null,
    isActive: false,
  };
}

describe("useFirstPilotIntakeSubmit", () => {
  it("clears wizard session after post-create evidence upload attempt finishes", async () => {
    const callOrder: string[] = [];
    const file = new File(["evidence"], "brief.pdf", { type: "application/pdf" });

    createArchitectureRun.mockResolvedValueOnce({ run: { runId: "run-pilot" } });
    uploadWizardPendingDocumentEvidence.mockImplementation(async () => {
      callOrder.push("upload");

      return { ok: false };
    });
    clearWizardSession.mockImplementation(() => {
      callOrder.push("clear");
    });

    const creationProgress = buildCreationProgress();

    const { result } = renderHook(() =>
      useFirstPilotIntakeSubmit({
        startBlockerInput: {
          intake: {
            title: "Retail API review",
            brief: "Enough operator context for the architecture review.",
            evidenceFileCount: 1,
            evidenceFileNames: ["brief.pdf"],
            limitedEvidenceAnalysisAcknowledged: true,
            l0Must: { complete: true, gaps: [] },
          },
          policyPackCloudMismatch: null,
          scopeGateOpen: true,
          briefExceedsMaxLength: false,
          maxBriefLength: 10_000,
        },
        canStart: true,
        resolvedBrief: "Enough context for submit.",
        evidenceFiles: [file],
        setEvidenceFiles: vi.fn(),
        exampleTemplate: null,
        buildSubmitBody: () => ({ description: "Enough context for submit." }),
        clearWizardSession,
        creationProgress,
      }),
    );

    await act(async () => {
      await result.current.submitRun();
    });

    expect(uploadWizardPendingDocumentEvidence).toHaveBeenCalledWith("run-pilot", [file]);
    expect(clearWizardSession).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["upload", "clear"]);
  });

  it("retains evidence files when post-create upload is deferred", async () => {
    const file = new File(["evidence"], "brief.pdf", { type: "application/pdf" });
    const setEvidenceFiles = vi.fn();

    createArchitectureRun.mockResolvedValueOnce({ run: { runId: "run-pilot" } });
    uploadWizardPendingDocumentEvidence.mockResolvedValueOnce({ ok: false });

    const creationProgress = buildCreationProgress();

    const { result } = renderHook(() =>
      useFirstPilotIntakeSubmit({
        startBlockerInput: {
          intake: {
            title: "Retail API review",
            brief: "Enough operator context for the architecture review.",
            evidenceFileCount: 1,
            evidenceFileNames: ["brief.pdf"],
            limitedEvidenceAnalysisAcknowledged: true,
            l0Must: { complete: true, gaps: [] },
          },
          policyPackCloudMismatch: null,
          scopeGateOpen: true,
          briefExceedsMaxLength: false,
          maxBriefLength: 10_000,
        },
        canStart: true,
        resolvedBrief: "Enough context for submit.",
        evidenceFiles: [file],
        setEvidenceFiles,
        exampleTemplate: null,
        buildSubmitBody: () => ({ description: "Enough context for submit." }),
        clearWizardSession: vi.fn(),
        creationProgress,
      }),
    );

    await act(async () => {
      await result.current.submitRun();
    });

    expect(setEvidenceFiles).not.toHaveBeenCalled();
  });
});
