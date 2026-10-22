"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { resolveSsoWizardPrimaryDisabledReason } from "@/lib/sso-wizard-disabled-cta";
import {
  SSO_WIZARD_IDP_STEP_HEADING,
  SSO_WIZARD_PROTOCOL_STEP_HEADING,
} from "@/lib/sso-wizard-copy";

import { SSO_WIZARD_STEPS, type SsoWizardState } from "./sso-wizard-state";

export type UseSsoWizardStepStateOptions = {
  state: SsoWizardState;
  busy: boolean;
  initialStep?: number;
  onBeforeStepChange?: () => void;
};

export type UseSsoWizardStepStateResult = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  completedSteps: number[];
  canProceed: boolean;
  canActivate: boolean;
  isLastStep: boolean;
  primaryDisabledReason: ReturnType<typeof resolveSsoWizardPrimaryDisabledReason>;
  stepHeading: string | undefined;
  handleContinue: () => void;
  handleBack: () => void;
  handleStepSelect: (targetStep: number) => void;
};

export function useSsoWizardStepState(
  options: UseSsoWizardStepStateOptions,
): UseSsoWizardStepStateResult {
  const { state, busy, initialStep = 0, onBeforeStepChange } = options;
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    document.getElementById("sso-wizard-step-heading")?.focus();
  }, [step]);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (state.idpPresetId !== null) {
      done.push(0);
    }

    if (state.protocol !== null) {
      done.push(1);
    }

    if (state.issuerUri.trim().length > 0) {
      done.push(2);
    }

    if (state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0)) {
      done.push(3);
    }

    if (state.testLoginSuccess) {
      done.push(4);
    }

    return done;
  }, [state]);

  const canProceedStep0 = state.idpPresetId !== null;
  const canProceedStep1 = state.protocol !== null;
  const canProceedStep2 = state.issuerUri.trim().length > 0;
  const canProceedStep3 =
    state.claimMapping.roleClaimName.trim().length > 0 &&
    state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0 && m.archLucidRole.trim().length > 0);
  const canProceedStep4 = state.testLoginSuccess;
  const canActivate = canProceedStep4 && state.protocol !== null;

  const canProceed =
    (step === 0 && canProceedStep0) ||
    (step === 1 && canProceedStep1) ||
    (step === 2 && canProceedStep2) ||
    (step === 3 && canProceedStep3) ||
    (step === 4 && canProceedStep4) ||
    step === 5;

  const isLastStep = step === SSO_WIZARD_STEPS.length - 1;

  const primaryDisabledReason = useMemo(
    () =>
      resolveSsoWizardPrimaryDisabledReason({
        step,
        isLastStep,
        busy,
        canContinue: canProceed,
        canActivate,
      }),
    [busy, canActivate, canProceed, isLastStep, step],
  );

  const currentStepMeta = SSO_WIZARD_STEPS[step];
  const stepHeading =
    step === 0
      ? SSO_WIZARD_IDP_STEP_HEADING
      : step === 1
        ? SSO_WIZARD_PROTOCOL_STEP_HEADING
        : currentStepMeta?.label;

  const handleContinue = useCallback(() => {
    if (!canProceed || busy) {
      return;
    }

    onBeforeStepChange?.();
    setStep((current) => Math.min(SSO_WIZARD_STEPS.length - 1, current + 1));
  }, [busy, canProceed, onBeforeStepChange]);

  const handleBack = useCallback(() => {
    onBeforeStepChange?.();
    setStep((current) => Math.max(0, current - 1));
  }, [onBeforeStepChange]);

  const handleStepSelect = useCallback(
    (targetStep: number) => {
      if (targetStep > step) {
        return;
      }

      onBeforeStepChange?.();
      setStep(targetStep);
    },
    [onBeforeStepChange, step],
  );

  return {
    step,
    setStep,
    completedSteps,
    canProceed,
    canActivate,
    isLastStep,
    primaryDisabledReason,
    stepHeading,
    handleContinue,
    handleBack,
    handleStepSelect,
  };
}
