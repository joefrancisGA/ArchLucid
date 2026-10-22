import { zodResolver } from "@hookform/resolvers/zod";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm, useFormContext, type UseFormReturn } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";
import { buildDefaultWizardValues, wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";
import { WIZARD_STEP_FIELD_GROUPS } from "@/lib/wizard-step-fields";
import type { WizardStepDefinition, WizardStepFieldGroup } from "@/lib/wizard-step-sequence";

import {
  useQuickFamilyWizardFlow,
  type QuickFamilyWizardFlow,
  type QuickFamilyWizardFlowOptions,
} from "./use-quick-family-wizard-flow";

const createRun = vi.fn();

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

const STEPS: readonly WizardStepDefinition[] = [
  { label: "Identity", description: "Name the system" },
  { label: "Evidence", description: "Optional evidence" },
  { label: "Review & submit", description: "Confirm and create" },
];

/** Only the first step gates on fields, mirroring the SimplifiedPilot registry shape. */
function stepFieldGroup(stepIndex: number): WizardStepFieldGroup | null {
  if (stepIndex !== 0) {
    return null;
  }

  return WIZARD_STEP_FIELD_GROUPS[2] ?? null;
}

type ProbedFlow = {
  readonly flow: QuickFamilyWizardFlow;
  readonly form: UseFormReturn<WizardFormValues>;
};

function FormHarness(props: { readonly children: ReactNode }) {
  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: buildDefaultWizardValues(),
    mode: "onBlur",
  });

  return <FormProvider {...form}>{props.children}</FormProvider>;
}

function renderFlow(overrides?: Partial<QuickFamilyWizardFlowOptions>) {
  const options: QuickFamilyWizardFlowOptions = {
    steps: STEPS,
    telemetryWizardName: "TestWizard",
    blocksLlmExecution: false,
    onRunCreated: vi.fn(),
    resolveStepFieldGroup: stepFieldGroup,
    buildPayloadOptions: () => ({ requestSource: "wizard" }),
    ...overrides,
  };

  return renderHook<ProbedFlow, void>(
    () => ({ flow: useQuickFamilyWizardFlow(options), form: useFormContext<WizardFormValues>() }),
    { wrapper: FormHarness },
  );
}

async function fillValidIdentityStep(form: UseFormReturn<WizardFormValues>): Promise<void> {
  await act(async () => {
    form.setValue("systemName", "MyRetailApp");
    form.setValue(
      "description",
      "Ten char min: design a secure retail API on Azure with SQL and App Service for the pilot scope.",
    );
  });
}

describe("useQuickFamilyWizardFlow", () => {
  beforeEach(() => {
    createRun.mockReset();
  });

  it("starts on the first step and treats the last step as the review step", () => {
    const { result } = renderFlow();

    expect(result.current.flow.stepIndex).toBe(0);
    expect(result.current.flow.isFirstStep).toBe(true);
    expect(result.current.flow.isReviewStep).toBe(false);
  });

  it("blocks Next with inline copy when the step's fields are invalid", async () => {
    const { result } = renderFlow();

    await act(async () => {
      result.current.form.setValue("systemName", "");
    });

    await act(async () => {
      await result.current.flow.goNext();
    });

    expect(result.current.flow.stepIndex).toBe(0);
    expect(result.current.flow.stepValidationMessage).toBe(REVIEW_START_STEP_VALIDATION_MESSAGE);
  });

  it("advances and clears the validation message once the fields pass", async () => {
    const { result } = renderFlow();
    await fillValidIdentityStep(result.current.form);

    await act(async () => {
      await result.current.flow.goNext();
    });

    expect(result.current.flow.stepIndex).toBe(1);
    expect(result.current.flow.stepValidationMessage).toBeNull();
  });

  it("stays on the step when the caller's async gate rejects the advance", async () => {
    const beforeAdvance = vi.fn().mockResolvedValue(false);
    const { result } = renderFlow({ beforeAdvance });
    await fillValidIdentityStep(result.current.form);

    await act(async () => {
      await result.current.flow.goNext();
    });

    expect(beforeAdvance).toHaveBeenCalledWith(0);
    expect(result.current.flow.stepIndex).toBe(0);
  });

  it("never walks back past the first step", () => {
    const { result } = renderFlow();

    act(() => {
      result.current.flow.goBack();
    });

    expect(result.current.flow.stepIndex).toBe(0);
  });

  it("submits the create-run payload and reports the new review id", async () => {
    createRun.mockResolvedValue({ run: { runId: "flow-run-1" } });
    const onRunCreated = vi.fn();
    const { result } = renderFlow({ onRunCreated });
    await fillValidIdentityStep(result.current.form);

    await act(async () => {
      await result.current.flow.submitRun();
    });

    expect(createRun).toHaveBeenCalledTimes(1);
    expect(onRunCreated).toHaveBeenCalledWith("flow-run-1");
    expect(result.current.flow.submitError).toBeNull();
  });

  it("adds the template stage to create progress when the wizard prefilled from a template", async () => {
    createRun.mockResolvedValue({ run: { runId: "flow-run-2" } });
    const { result } = renderFlow({ hasTemplate: true });
    await fillValidIdentityStep(result.current.form);

    await act(async () => {
      await result.current.flow.submitRun();
    });

    expect(
      result.current.flow.creationProgress.stages.some((stage) => stage.id === "applying-template"),
    ).toBe(true);
  });

  it("keeps the thrown error for the review-step problem panel", async () => {
    const failure = new Error("Create rejected");
    createRun.mockRejectedValue(failure);
    const { result } = renderFlow();
    await fillValidIdentityStep(result.current.form);

    await act(async () => {
      await result.current.flow.submitRun();
    });

    expect(result.current.flow.submitError).toBe(failure);
    expect(result.current.flow.isCreating).toBe(false);
  });
});
