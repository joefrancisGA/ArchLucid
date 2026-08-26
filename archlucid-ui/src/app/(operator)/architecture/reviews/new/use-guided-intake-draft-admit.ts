"use client";

import { useCallback } from "react";

import {
  admitDraftRequest,
  answerDraftQuestion,
  createDraftRequest,
  getDraftRequest,
  patchDraftRequest,
  skipDraftQuestion,
} from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { structuredBriefToPatchPayload } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import {
  CREATE_ARCHITECTURE_INTENT,
  START_REVIEW_INTENT,
} from "@/lib/architecture/architecture-workflow-intent";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";
import { GUIDED_INTAKE_READINESS_SUCCESS_TOAST } from "@/lib/guided-intake-copy";
import { REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import { showError, showSuccess } from "@/lib/toast";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import type { GuidedIntakeDraftCoreState } from "./use-guided-intake-draft-workflow";

type Options = {
  readonly form: GuidedIntakeBriefForm;
  readonly isCreateArchitectureFlow: boolean;
  readonly priorRunId?: string | null;
  readonly setStep: (stepIndex: number) => void;
  readonly core: GuidedIntakeDraftCoreState;
  readonly refreshQuestions: (id: string) => Promise<void>;
  readonly applyAdmittedRequiredMustQuestionKeysFromDocument: (
    document: { requiredMustQuestionKeys?: string[] } | undefined,
  ) => void;
};

export function useGuidedIntakeDraftAdmit(options: Options) {
  const {
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    core,
    form,
    isCreateArchitectureFlow,
    priorRunId,
    refreshQuestions,
    setStep,
  } = options;

  const {
    actorSet,
    briefTextForAdmission,
    businessOutcome,
    focusedPilotModeEnabled,
    freeTextIntent,
    systemName,
  } = form;

  const runAdmission = useCallback(async () => {
    core.setBusy(true);
    core.setSubmitError(null);
    core.setRedirectReason(null);
    core.setRedirectVerdict(null);

    try {
      let id = core.draftId;

      if (id === null) {
        const created = await createDraftRequest(
          freeTextIntent.trim(),
          isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
          priorRunId,
        );
        id = created.draftId;
        core.setDraftId(id);
        core.setDraftStatus(created.status);
      }

      await patchDraftRequest(id, {
        freeTextIntent: briefTextForAdmission(),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
        structuredBrief: structuredBriefToPatchPayload(core.structuredBrief),
      });

      const admission = await admitDraftRequest(id);

      if (!admission.admitted) {
        core.setRedirectReason(admission.redirectReason ?? admission.verdict.summary);
        core.setRedirectVerdict(admission.verdict);
        showError(
          REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
          admission.redirectReason ?? "Readiness checks redirected this draft.",
        );

        return;
      }

      core.setPendingQuestions(admission.pendingMustQuestions);
      core.setRequiredMustQuestionKeys(admission.requiredMustQuestionKeys);
      core.setDraftStatus(admission.status);
      applyAdmittedRequiredMustQuestionKeysFromDocument(admission.draft.document);
      core.setSavedLocallyQuestionKeys(new Set());
      await refreshQuestions(id);
      core.setViewAllClarifications(false);
      setStep(1);
      const admittedDraft = await getDraftRequest(id);
      applyAdmittedRequiredMustQuestionKeysFromDocument(admittedDraft.document);
      upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(admittedDraft));
      showSuccess(GUIDED_INTAKE_READINESS_SUCCESS_TOAST);
    } catch (error) {
      core.setSubmitError(error);

      if (isApiRequestError(error)) {
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
      }
    } finally {
      core.setBusy(false);
    }
  }, [
    actorSet,
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    briefTextForAdmission,
    businessOutcome,
    core,
    focusedPilotModeEnabled,
    freeTextIntent,
    isCreateArchitectureFlow,
    priorRunId,
    refreshQuestions,
    setStep,
    systemName,
  ]);

  const reviewAnswers = useCallback(async () => {
    if (core.draftId === null) {
      return;
    }

    const unresolvedQuestions = core.pendingQuestions.filter(
      (question) => !core.savedLocallyQuestionKeys.has(question.questionKey),
    );

    if (unresolvedQuestions.length > 0) {
      return;
    }

    core.setBusy(true);
    core.setSubmitError(null);

    try {
      for (const question of core.pendingQuestions) {
        if (!core.savedLocallyQuestionKeys.has(question.questionKey)) {
          continue;
        }

        const answer = core.answers[question.questionKey]?.trim() ?? "";

        if (answer.length === 0) {
          continue;
        }

        await answerDraftQuestion(core.draftId, question.questionKey, answer);
      }

      await refreshQuestions(core.draftId);
      core.setSavedLocallyQuestionKeys(new Set());
      setStep(2);
    } catch (error) {
      core.setSubmitError(error);

      if (isApiRequestError(error)) {
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
      }
    } finally {
      core.setBusy(false);
    }
  }, [core, refreshQuestions, setStep]);

  const saveAndContinue = useCallback(
    (questionKey: string) => {
      const answer = core.answers[questionKey]?.trim() ?? "";

      if (answer.length === 0) {
        return;
      }

      core.setSavedLocallyQuestionKeys((current) => {
        const next = new Set(current);
        next.add(questionKey);

        return next;
      });
    },
    [core],
  );

  const skipQuestion = useCallback(
    async (questionKey: string) => {
      if (core.draftId === null) {
        core.setSubmitError(new Error("Draft is not ready yet. Go back and continue from the brief step."));
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, "Draft is not ready yet. Continue from the brief step first.");

        return;
      }

      core.setBusy(true);
      core.setSubmitError(null);

      try {
        await skipDraftQuestion(core.draftId, questionKey);
        core.setSavedLocallyQuestionKeys((current) => {
          const next = new Set(current);
          next.add(questionKey);

          return next;
        });
        await refreshQuestions(core.draftId);
        showSuccess("Question skipped — recorded on the transparency trail.");
      } catch (error) {
        core.setSubmitError(error);

        if (isApiRequestError(error)) {
          showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
        }
      } finally {
        core.setBusy(false);
      }
    },
    [core, refreshQuestions],
  );

  return {
    runAdmission,
    reviewAnswers,
    saveAndContinue,
    skipQuestion,
  };
}
