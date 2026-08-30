"use client";

import { useCallback, useRef, useState, type MutableRefObject } from "react";
import type { UseFormGetValues, UseFormReset } from "react-hook-form";

import { useReviewsNewSuppressWizardResumePrompt } from "@/hooks/use-reviews-new-suppress-wizard-resume-prompt";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import {
  WIZARD_SESSION_IDS,
  wizardSessionHasTextContent,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type WizardDraftSaveFeedback = {
  readonly kind: "ok" | "err";
  readonly message: string;
};

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
  readonly draftSaveFeedback: WizardDraftSaveFeedback | null;
  readonly clearDraftSaveFeedback: () => void;
  readonly clearWizardSessionRef: MutableRefObject<() => void>;
};

/** Template wizard session restore/persistence for the full guided new-run flow. */
export function useNewRunWizardTemplateRestore(
  params: UseNewRunWizardTemplateRestoreParams,
): UseNewRunWizardTemplateRestoreResult {
  const { stepIndex, templateWizardSessionState, showFullWizardShell, reset, setStepIndex, getValues } = params;

  const clearWizardSessionRef = useRef<() => void>(() => {});
  const [draftSaveFeedback, setDraftSaveFeedback] = useState<WizardDraftSaveFeedback | null>(null);

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
      setDraftSaveFeedback({ kind: "ok", message: "Draft saved in this browser." });
    } catch {
      setDraftSaveFeedback({ kind: "err", message: "Could not save draft." });
    }
  }, [getValues, stepIndex]);

  const clearDraftSaveFeedback = useCallback(() => {
    setDraftSaveFeedback(null);
  }, []);

  return {
    templateWizardSession,
    suppressWizardResumePrompt,
    saveWizardDraft,
    draftSaveFeedback,
    clearDraftSaveFeedback,
    clearWizardSessionRef,
  };
}
