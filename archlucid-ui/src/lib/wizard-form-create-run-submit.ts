import type { UseFormGetValues, UseFormTrigger } from "react-hook-form";

import type { ReviewCreationProgressBeginInput } from "@/hooks/use-review-creation-progress";
import { createArchitectureRun } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE,
  REVIEW_START_SUBMIT_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import { trackWizardCompleted } from "@/lib/telemetry";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  wizardValuesToCreateRunPayload,
  type WizardCreateRunPayloadOptions,
} from "@/lib/wizard-payload";

export type WizardFormCreateRunGateFailure = "validation" | "llm-budget";

export type WizardFormCreateRunExecuteResult =
  | { readonly ok: true; readonly runId: string }
  | { readonly ok: false; readonly reason: "no-run-id" }
  | { readonly ok: false; readonly reason: "error"; readonly error: unknown };

export type WizardFormCreateRunResult =
  | { readonly ok: true; readonly runId: string }
  | {
      readonly ok: false;
      readonly reason: WizardFormCreateRunGateFailure | "no-run-id" | "error";
      readonly error?: unknown;
    };

type GateArgs = {
  readonly trigger: UseFormTrigger<WizardFormValues>;
  readonly blocksLlmExecution: boolean;
};

type ExecuteArgs = {
  readonly getValues: UseFormGetValues<WizardFormValues>;
  readonly payloadOptions: WizardCreateRunPayloadOptions;
  /** Telemetry `wizardType` passed to {@link trackWizardCompleted}. */
  readonly wizardCompletedName: string;
};

/** RHF + monthly LLM budget gates shared by every WizardFormValues create-run path. */
export async function evaluateWizardFormCreateRunGates(
  args: GateArgs,
): Promise<WizardFormCreateRunGateFailure | null> {
  const ok = await args.trigger(undefined, { shouldFocus: true });

  if (!ok) {
    return "validation";
  }

  if (args.blocksLlmExecution) {
    return "llm-budget";
  }

  return null;
}

/** POST create-run after gates have already passed. Records funnel + wizard-completed telemetry. */
export async function executeWizardFormCreateRun(
  args: ExecuteArgs,
): Promise<WizardFormCreateRunExecuteResult> {
  try {
    const body = wizardValuesToCreateRunPayload(args.getValues(), args.payloadOptions);
    const res = await createArchitectureRun(body);
    const runId = res.run?.runId ?? null;

    if (runId === null || runId.length === 0) {
      return { ok: false, reason: "no-run-id" };
    }

    trackWizardCompleted(args.wizardCompletedName);
    recordFirstTenantFunnelEvent("first_run_started");

    return { ok: true, runId };
  } catch (error: unknown) {
    return { ok: false, reason: "error", error };
  }
}

/**
 * Shared RHF create-run submit path for QuickStart, SimplifiedPilot, and the full NewRun shell.
 * Callers that need submitting=true only around the network call should use the gate + execute pair.
 */
export async function submitWizardFormCreateRun(
  args: GateArgs & ExecuteArgs,
): Promise<WizardFormCreateRunResult> {
  const gateFailure = await evaluateWizardFormCreateRunGates(args);

  if (gateFailure !== null) {
    return { ok: false, reason: gateFailure };
  }

  return executeWizardFormCreateRun(args);
}

/**
 * Subset of `useReviewCreationProgress` needed by the shared submit path. The hook owns a
 * watchdog that reports `unresolved` when the browser stops waiting, which is distinct from
 * a server-reported failure — create is idempotent per wizard session, so a recheck resolves
 * to the same review rather than a duplicate.
 */
export type WizardCreateRunProgressBridge = {
  readonly begin: (input?: ReviewCreationProgressBeginInput) => void;
  readonly succeed: () => void;
  readonly fail: (message?: string) => void;
};

export function resolveCreateRunFailureMessage(error: unknown): string {
  if (isApiRequestError(error) && error.message.trim().length > 0) {
    return error.message;
  }

  return REVIEW_START_CREATION_FAILED_MESSAGE;
}

export type SubmitQuickFamilyWizardCreateRunArgs = GateArgs &
  ExecuteArgs & {
    readonly setSubmitting: (value: boolean) => void;
    readonly setSubmitError: (error: unknown | null) => void;
    readonly setStepValidationMessage: (message: string | null) => void;
    readonly onRunCreated: (runId: string) => void;
    /** When supplied, drives staged-progress chrome and the unresolved-not-failed recovery notice. */
    readonly progress?: WizardCreateRunProgressBridge;
    /** Stage hints for {@link WizardCreateRunProgressBridge.begin} (e.g. a template stage). */
    readonly progressBeginInput?: ReviewCreationProgressBeginInput;
  };

/**
 * QuickStart / SimplifiedPilot share the same inline-validation UX around the shared create-run path.
 * NewRun maps failures to toasts instead and keeps post-create evidence upload in the shell.
 */
export async function submitQuickFamilyWizardCreateRun(
  args: SubmitQuickFamilyWizardCreateRunArgs,
): Promise<void> {
  const gateFailure = await evaluateWizardFormCreateRunGates(args);

  if (gateFailure === "validation") {
    args.setStepValidationMessage(REVIEW_START_SUBMIT_VALIDATION_MESSAGE);

    return;
  }

  if (gateFailure === "llm-budget") {
    args.setStepValidationMessage(REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);

    return;
  }

  args.setSubmitting(true);
  args.setSubmitError(null);
  args.setStepValidationMessage(null);
  args.progress?.begin(args.progressBeginInput ?? { hasTemplate: false });

  try {
    const result = await executeWizardFormCreateRun(args);

    if (result.ok) {
      args.progress?.succeed();
      args.onRunCreated(result.runId);

      return;
    }

    if (result.reason === "no-run-id") {
      args.progress?.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
      args.setSubmitError(new Error(REVIEW_START_CREATION_FAILED_MESSAGE));

      return;
    }

    args.progress?.fail(resolveCreateRunFailureMessage(result.error));
    args.setSubmitError(result.error ?? new Error(REVIEW_START_CREATION_FAILED_MESSAGE));
  } finally {
    args.setSubmitting(false);
  }
}
