import { beforeEach, describe, expect, it, vi } from "vitest";

import { createArchitectureRun } from "@/lib/api";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE,
  REVIEW_START_SUBMIT_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import { trackWizardCompleted } from "@/lib/telemetry";
import {
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

vi.mock("@/lib/wizard-payload", () => ({
  wizardValuesToCreateRunPayload: vi.fn(() => ({ description: "payload" })),
}));

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
});
