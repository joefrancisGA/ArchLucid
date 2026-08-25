import { beforeEach, describe, expect, it, vi } from "vitest";

import { createArchitectureRun } from "@/lib/api";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE,
  REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE,
  REVIEW_START_SUBMIT_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import { trackWizardCompleted } from "@/lib/telemetry";
import {
  recheckQuickFamilyWizardCreateRun,
  submitQuickFamilyWizardCreateRun,
  submitWizardFormCreateRun,
} from "@/lib/wizard-form-create-run-submit";
import type { WizardFormValues } from "@/lib/wizard-schema";

vi.mock("@/lib/api", () => ({
  createArchitectureRun: vi.fn(),
}));

vi.mock("@/lib/telemetry", () => ({
  trackWizardCompleted: vi.fn(),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/wizard-payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/wizard-payload")>();

  return {
    ...actual,
    wizardValuesToCreateRunPayload: vi.fn(() => ({ description: "payload" })),
  };
});

const createArchitectureRunMock = vi.mocked(createArchitectureRun);
const trackWizardCompletedMock = vi.mocked(trackWizardCompleted);

function emptyValues(): WizardFormValues {
  return {
    requestId: "req-1",
    description: "desc",
    systemName: "sys",
    environment: "dev",
    cloudProvider: "Azure",
    constraints: [],
    requiredCapabilities: [],
    assumptions: [],
    policyReferences: [],
    topologyHints: [],
    securityBaselineHints: [],
    documents: [],
    infrastructureDeclarations: [],
    priorManifestVersion: "",
    modelExecutionProfileOverride: "WorkspaceDefault",
  } as WizardFormValues;
}

describe("submitWizardFormCreateRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation when trigger fails", async () => {
    const result = await submitWizardFormCreateRun({
      trigger: vi.fn().mockResolvedValue(false),
      getValues: vi.fn(),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
    });

    expect(result).toEqual({ ok: false, reason: "validation" });
    expect(createArchitectureRunMock).not.toHaveBeenCalled();
  });

  it("returns llm-budget when execution is blocked", async () => {
    const result = await submitWizardFormCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(),
      blocksLlmExecution: true,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
    });

    expect(result).toEqual({ ok: false, reason: "llm-budget" });
    expect(createArchitectureRunMock).not.toHaveBeenCalled();
  });

  it("returns policy-cloud-mismatch when packs do not match cloud target", async () => {
    const result = await submitWizardFormCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => ({
        ...emptyValues(),
        cloudProvider: "Aws",
        policyReferences: ["cis-azure"],
      })),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard", focusedPilotModeEnabled: false },
      wizardCompletedName: "QuickStart",
    });

    expect(result).toEqual({ ok: false, reason: "policy-cloud-mismatch" });
    expect(createArchitectureRunMock).not.toHaveBeenCalled();
  });

  it("returns runId and records telemetry on success", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-9" } } as never);

    const result = await submitWizardFormCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => emptyValues()),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard", focusedPilotModeEnabled: true },
      wizardCompletedName: "SimplifiedPilot",
    });

    expect(result).toEqual({ ok: true, runId: "run-9" });
    expect(trackWizardCompletedMock).toHaveBeenCalledWith("SimplifiedPilot");
    expect(createArchitectureRunMock).toHaveBeenCalledOnce();
  });

  it("returns no-run-id when API omits runId", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: null } as never);

    const result = await submitWizardFormCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => emptyValues()),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
    });

    expect(result).toEqual({ ok: false, reason: "no-run-id" });
  });
});

describe("submitQuickFamilyWizardCreateRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps gate failures to step validation messages without flipping submitting", async () => {
    const setStepValidationMessage = vi.fn();
    const setSubmitting = vi.fn();
    const setSubmitError = vi.fn();
    const onRunCreated = vi.fn();

    await submitQuickFamilyWizardCreateRun({
      trigger: vi.fn().mockResolvedValue(false),
      getValues: vi.fn(),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
    });

    expect(setStepValidationMessage).toHaveBeenCalledWith(REVIEW_START_SUBMIT_VALIDATION_MESSAGE);
    expect(setSubmitting).not.toHaveBeenCalled();
    expect(onRunCreated).not.toHaveBeenCalled();

    await submitQuickFamilyWizardCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(),
      blocksLlmExecution: true,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
    });

    expect(setStepValidationMessage).toHaveBeenCalledWith(REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);
    expect(setSubmitting).not.toHaveBeenCalled();

    await submitQuickFamilyWizardCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => ({
        ...emptyValues(),
        cloudProvider: "Aws",
        policyReferences: ["cis-azure"],
      })),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard", focusedPilotModeEnabled: false },
      wizardCompletedName: "QuickStart",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage,
      onRunCreated,
    });

    expect(setStepValidationMessage).toHaveBeenCalledWith(
      expect.stringContaining(REVIEW_START_POLICY_CLOUD_MISMATCH_MESSAGE),
    );
    expect(setSubmitting).not.toHaveBeenCalled();
  });

  it("maps missing runId to submit error after gates pass", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: null } as never);
    const setSubmitError = vi.fn();
    const setSubmitting = vi.fn();

    await submitQuickFamilyWizardCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => emptyValues()),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
      setSubmitting,
      setSubmitError,
      setStepValidationMessage: vi.fn(),
      onRunCreated: vi.fn(),
    });

    expect(setSubmitting).toHaveBeenCalledWith(true);
    expect(setSubmitting).toHaveBeenCalledWith(false);
    expect(setSubmitError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: REVIEW_START_CREATION_FAILED_MESSAGE,
      }),
    );
  });

  it("calls progress bridge begin, succeed, and fail around the create-run POST", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-42" } } as never);
    const progress = {
      begin: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      markUnresolved: vi.fn(),
      bindOperation: vi.fn(),
    };
    const onRunCreated = vi.fn();

    await submitQuickFamilyWizardCreateRun({
      trigger: vi.fn().mockResolvedValue(true),
      getValues: vi.fn(() => emptyValues()),
      blocksLlmExecution: false,
      payloadOptions: { requestSource: "wizard" },
      wizardCompletedName: "QuickStart",
      setSubmitting: vi.fn(),
      setSubmitError: vi.fn(),
      setStepValidationMessage: vi.fn(),
      onRunCreated,
      progress,
    });

    expect(progress.begin).toHaveBeenCalledOnce();
    expect(progress.succeed).toHaveBeenCalledOnce();
    expect(progress.fail).not.toHaveBeenCalled();
    expect(onRunCreated).toHaveBeenCalledWith("run-42");
  });
});

describe("recheckQuickFamilyWizardCreateRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replays the idempotent create without calling progress.begin", async () => {
    createArchitectureRunMock.mockResolvedValue({ run: { runId: "run-recheck" } } as never);
    const progress = {
      begin: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      markUnresolved: vi.fn(),
      bindOperation: vi.fn(),
      beginRecheck: vi.fn(),
      endRecheck: vi.fn(),
      markResumed: vi.fn(),
    };
    const onRunFound = vi.fn();

    await recheckQuickFamilyWizardCreateRun({
      getValues: vi.fn(() => emptyValues()),
      payloadOptions: { requestSource: "wizard" },
      onRunFound,
      progress,
    });

    expect(progress.beginRecheck).toHaveBeenCalledOnce();
    expect(progress.begin).not.toHaveBeenCalled();
    expect(progress.markResumed).toHaveBeenCalledOnce();
    expect(onRunFound).toHaveBeenCalledWith("run-recheck");
  });

  it("ends the recheck spinner when the gateway is still unresolved", async () => {
    const { ArchitectureRequestCreateUnresolvedError } = await import(
      "@/lib/api/architecture-request-create-unresolved-error"
    );
    createArchitectureRunMock.mockRejectedValue(
      new ArchitectureRequestCreateUnresolvedError({
        problem: { title: "Bad Gateway" },
        correlationId: null,
        httpStatus: 502,
      }),
    );
    const progress = {
      begin: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      markUnresolved: vi.fn(),
      bindOperation: vi.fn(),
      beginRecheck: vi.fn(),
      endRecheck: vi.fn(),
      markResumed: vi.fn(),
    };

    await recheckQuickFamilyWizardCreateRun({
      getValues: vi.fn(() => emptyValues()),
      payloadOptions: { requestSource: "wizard" },
      onRunFound: vi.fn(),
      progress,
    });

    expect(progress.endRecheck).toHaveBeenCalledOnce();
    expect(progress.markResumed).not.toHaveBeenCalled();
    expect(progress.begin).not.toHaveBeenCalled();
  });
});
