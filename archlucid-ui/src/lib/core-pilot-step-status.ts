import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { CORE_PILOT_STEP_COUNT } from "@/lib/core-pilot-steps";
import type { CorePilotProgressSnapshot } from "@/lib/usability/core-pilot-progress-tracker";

export type CorePilotStepDerivedStatus = "done" | "in-progress" | "not-started" | "skipped";

export type CorePilotStepStatusContext = CorePilotCommitContext & {
  /** Optional-step indices the operator explicitly skipped (persisted client-side). */
  readonly optionalStepsSkipped: readonly boolean[];
};

/** Steps 0–2 are required for first-review completion; 3–6 are optional enrichments. */
export const CORE_PILOT_REQUIRED_STEP_INDICES: readonly number[] = [0, 1, 2];

export const CORE_PILOT_OPTIONAL_STEP_INDICES: readonly number[] = [3, 4, 5, 6];

export function isCorePilotStepOptional(stepIndex: number): boolean {
  return stepIndex >= 3;
}

export function resolveCorePilotStepStatus(
  stepIndex: number,
  context: CorePilotStepStatusContext,
): CorePilotStepDerivedStatus {
  if (isCorePilotStepOptional(stepIndex)) {
    if (context.optionalStepsSkipped[stepIndex] === true) {
      return "skipped";
    }

    if (stepIndex === 6 && context.hasCommittedManifest) {
      return "done";
    }

    return "not-started";
  }

  if (stepIndex === 0) {
    if (context.latestRunId !== null || context.hasCommittedManifest) {
      return "done";
    }

    return "not-started";
  }

  if (stepIndex === 1) {
    if (context.hasCommittedManifest || context.latestRunReadyToFinalize) {
      return "done";
    }

    if (context.latestRunId !== null) {
      return "in-progress";
    }

    return "not-started";
  }

  if (stepIndex === 2) {
    if (context.hasCommittedManifest) {
      return "done";
    }

    if (context.latestRunReadyToFinalize) {
      return "in-progress";
    }

    return "not-started";
  }

  return "not-started";
}

export function resolveCorePilotStepStatuses(
  context: CorePilotStepStatusContext,
): readonly CorePilotStepDerivedStatus[] {
  return Array.from({ length: CORE_PILOT_STEP_COUNT }, (_, index) =>
    resolveCorePilotStepStatus(index, context),
  );
}

export function areCorePilotRequiredStepsComplete(
  statuses: readonly CorePilotStepDerivedStatus[],
): boolean {
  return CORE_PILOT_REQUIRED_STEP_INDICES.every((index) => statuses[index] === "done");
}

export function resolveCorePilotNextStepIndex(
  statuses: readonly CorePilotStepDerivedStatus[],
): number | null {
  for (let index = 0; index < statuses.length; index++) {
    const status = statuses[index];

    if (status === "not-started" || status === "in-progress") {
      return index;
    }
  }

  return null;
}

export function buildCorePilotProgressFromStatuses(
  statuses: readonly CorePilotStepDerivedStatus[],
): CorePilotProgressSnapshot {
  const completedCount = statuses.filter((status) => status === "done").length;

  return {
    completedCount,
    totalCount: CORE_PILOT_STEP_COUNT,
    nextStepIndex: resolveCorePilotNextStepIndex(statuses),
    allDone: areCorePilotRequiredStepsComplete(statuses),
  };
}

export function buildCorePilotStepStatusContext(
  commitContext: CorePilotCommitContext,
  optionalStepsSkipped: readonly boolean[],
): CorePilotStepStatusContext {
  const paddedSkips = Array.from({ length: CORE_PILOT_STEP_COUNT }, (_, index) =>
    optionalStepsSkipped[index] === true,
  );

  return {
    ...commitContext,
    optionalStepsSkipped: paddedSkips,
  };
}

export function corePilotStepStatusTag(
  status: CorePilotStepDerivedStatus,
): { readonly kind: "ready" | "in-progress" | "draft" | "neutral"; readonly label: string } {
  switch (status) {
    case "done":
      return { kind: "ready", label: "Done" };
    case "in-progress":
      return { kind: "in-progress", label: "In progress" };
    case "skipped":
      return { kind: "neutral", label: "Skipped" };
    case "not-started":
      return { kind: "draft", label: "Not started" };
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}
