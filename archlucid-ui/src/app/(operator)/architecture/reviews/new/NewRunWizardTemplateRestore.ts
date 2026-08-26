"use client";

import { useCallback, useRef, type MutableRefObject } from "react";
import type { UseFormGetValues, UseFormReset } from "react-hook-form";

import { useReviewsNewSuppressWizardResumePrompt } from "@/hooks/use-reviews-new-suppress-wizard-resume-prompt";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { showError, showSuccess } from "@/lib/toast";
import {
  WIZARD_SESSION_IDS,
  wizardSessionHasTextContent,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type UseNewRunWizardTemplateRestoreParams = {
  readonly stepIndex: number;
  readonly templateWizardSessionState: WizardFormValues;
  readonly showFullWizardShell: boolean;
  readonly reset: UseFormReset<WizardFormValues>;
  readonly setStepIndex: (index: number) => void;
  readonly getValues: UseFormGetValues<WizardFormValues>;
};

export type UseNewRunWizardTemplateRestoreResult = {
  readonly templateWizardSession: ReturnType<typeof useWizardSessionPersistence>;
  readonly suppressWizardResumePrompt: boolean;
  readonly saveWizardDraft: () => void;
  readonly clearWizardSessionRef: MutableRefObject<() => void>;
};

/** Template wizard session restore/persistence for the full guided new-run flow. */
export function useNewRunWizardTemplateRestore(
  params: UseNewRunWizardTemplateRestoreParams,
): UseNewRunWizardTemplateRestoreResult {
  const { stepIndex, templateWizardSessionState, showFullWizardShell, reset, setStepIndex, getValues } = params;

  const clearWizardSessionRef = useRef<() => void>(() => {});

  const handleTemplateWizardRestore = useCallback(
    (snapshot: { stepIndex: number; state: WizardFormValues }) => {
      setStepIndex(snapshot.stepIndex);
      reset(snapshot.state);
    },
    [reset, setStepIndex],
  );

  const templateWizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewTemplates,
    stepIndex,
    state: templateWizardSessionState,
    enabled: showFullWizardShell,
    hasSaveableContent: (state, currentStep) =>
      currentStep > 0 ||
      wizardSessionHasTextContent(state.systemName) ||
      wizardSessionHasTextContent(state.description),
    onRestore: handleTemplateWizardRestore,
  });

  const suppressWizardResumePrompt = useReviewsNewSuppressWizardResumePrompt();
  clearWizardSessionRef.current = templateWizardSession.clearSession;

  const saveWizardDraft = useCallback(() => {
    try {
      writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewTemplates, {
        stepIndex,
        state: getValues(),
      });
      showSuccess("Draft saved in this browser.");
    } catch {
      showError("Wizard", "Could not save draft.");
    }
  }, [getValues, stepIndex]);

  return {
    templateWizardSession,
    suppressWizardResumePrompt,
    saveWizardDraft,
    clearWizardSessionRef,
  };
}
