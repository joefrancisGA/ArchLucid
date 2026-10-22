"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { trackWizardStepViewed } from "@/lib/telemetry";
import {
  clampWizardStepIndex,
  nextWizardStepIndex,
  previousWizardStepIndex,
  wizardStepLabelAt,
  type WizardStepDefinition,
} from "@/lib/wizard-step-sequence";

export type WizardStepNavigationOptions = {
  readonly steps: readonly WizardStepDefinition[];
  /** Telemetry `wizardType`, e.g. `FullGuided` or `SocraticIntake`. */
  readonly telemetryWizardName: string;
  /** Confirm/submit step; defaults to the last step index. */
  readonly reviewStepIndex?: number;
  readonly initialStepIndex?: number;
};

export type WizardStepNavigation = {
  readonly stepIndex: number;
  readonly setStepIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly stepCount: number;
  readonly isFirstStep: boolean;
  readonly isReviewStep: boolean;
  readonly stepLabel: string;
  readonly currentStep: WizardStepDefinition | undefined;
  readonly goBack: () => void;
  /** Advance one step without validation — callers gate with their own checks first. */
  readonly advance: () => void;
  readonly goToStep: (index: number) => void;
};

/**
 * Shared step index, telemetry, and back/next clamping for multi-step operator wizards.
 * Validation, submit, and step bodies stay with each wizard (RHF quick family, full NewRun, Socratic).
 */
export function useWizardStepNavigation(options: WizardStepNavigationOptions): WizardStepNavigation {
  const { steps, telemetryWizardName, reviewStepIndex, initialStepIndex = 0 } = options;

  const stepCount = steps.length;
  const resolvedReviewStepIndex =
    reviewStepIndex ?? Math.max(0, stepCount > 0 ? stepCount - 1 : 0);

  const [stepIndex, setStepIndex] = useState(() =>
    clampWizardStepIndex(initialStepIndex, stepCount),
  );

  const stepLabel = wizardStepLabelAt(steps, stepIndex);
  const currentStep = steps[stepIndex];

  useEffect(() => {
    trackWizardStepViewed(stepIndex, stepLabel, telemetryWizardName);
  }, [stepIndex, stepLabel, telemetryWizardName]);

  const goBack = useCallback(() => {
    setStepIndex((current) => previousWizardStepIndex(current));
  }, []);

  const advance = useCallback(() => {
    setStepIndex((current) => nextWizardStepIndex(current, stepCount));
  }, [stepCount]);

  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(clampWizardStepIndex(index, stepCount));
    },
    [stepCount],
  );

  return useMemo(
    () => ({
      stepIndex,
      setStepIndex,
      stepCount,
      isFirstStep: stepIndex === 0,
      isReviewStep: stepIndex === resolvedReviewStepIndex,
      stepLabel,
      currentStep,
      goBack,
      advance,
      goToStep,
    }),
    [
      advance,
      currentStep,
      goBack,
      goToStep,
      resolvedReviewStepIndex,
      stepCount,
      stepIndex,
      stepLabel,
    ],
  );
}
