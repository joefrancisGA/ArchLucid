"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  createDraftRequest,
  getDraftQuestions,
  getDraftRequest,
  patchDraftRequest,
} from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  architectureCreationDefaultActorSet,
  applyArchitectureCreationDraftToFormState,
  initializeArchitectureCreation,
} from "@/lib/architecture/architecture-creation-init";
import { structuredBriefToPatchPayload } from "@/lib/architecture/architecture-draft-structured-brief";
import { writeArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";
import {
  CREATE_ARCHITECTURE_INTENT,
  START_REVIEW_INTENT,
} from "@/lib/architecture/architecture-workflow-intent";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import { isGuidedIntakeAccessBlocked, resolveGuidedIntakeBlockedRedirectHref } from "@/lib/architecture/architecture-draft-intake-mode";
import { mergeAdmittedRequiredMustQuestionKeys } from "@/lib/guided-intake-clarification-progress";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";
import { showError, showSuccess } from "@/lib/toast";
import type { BranchDraftResponse, DraftElicitationQuestion, DraftRequestStatus } from "@/types/draft-intake";

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import type { GuidedIntakeDraftCoreState } from "./use-guided-intake-draft-workflow";

type Options = {
  readonly form: GuidedIntakeBriefForm;
  readonly isCreateArchitectureFlow: boolean;
  readonly sourceArchitectureId: string;
  readonly priorRunId?: string | null;
  readonly setStep: (stepIndex: number) => void;
  readonly navigate: (href: string) => void;
  readonly core: GuidedIntakeDraftCoreState;
};

export function useGuidedIntakeDraftCreate(options: Options) {
  const { core, form, isCreateArchitectureFlow, navigate, priorRunId, setStep, sourceArchitectureId } = options;
  const creationInitStartedRef = useRef(false);
  const sourceArchitectureLoadedRef = useRef(false);

  const {
    actorSet,
    briefTextForAdmission,
    businessOutcome,
    focusedPilotModeEnabled,
    freeTextIntent,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setSystemName,
    systemName,
  } = form;

  const applyAdmittedRequiredMustQuestionKeysFromDocument = useCallback(
    (document: { requiredMustQuestionKeys?: string[] } | undefined) => {
      core.setAdmittedRequiredMustQuestionKeys((current) =>
        mergeAdmittedRequiredMustQuestionKeys(current, document?.requiredMustQuestionKeys),
      );
    },
    [core],
  );

  useEffect(() => {
    if (!isCreateArchitectureFlow || creationInitStartedRef.current) {
      return;
    }

    creationInitStartedRef.current = true;

    void initializeArchitectureCreation().then(async (result) => {
      if (result.draftId !== null) {
        core.setDraftId(result.draftId);
        core.setDraftStatus(result.draft?.status ?? null);
        await patchDraftRequest(result.draftId, { workflowIntent: CREATE_ARCHITECTURE_INTENT });
      }

      const formState = applyArchitectureCreationDraftToFormState(result.draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      core.setStructuredBrief(formState.structuredBrief);
      core.setAllQuestions([...result.questionSelection.allQuestions]);
      core.setRequiredMustQuestionKeys([...result.questionSelection.requiredMustQuestionKeys]);
      core.setPendingQuestions([...result.questionSelection.pendingMustQuestions]);
      applyAdmittedRequiredMustQuestionKeysFromDocument(result.draft?.document);
    });
  }, [
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    core,
    isCreateArchitectureFlow,
    setBusinessOutcome,
    setFreeTextIntent,
    setSystemName,
  ]);

  useEffect(() => {
    if (sourceArchitectureId.length === 0 || isCreateArchitectureFlow || sourceArchitectureLoadedRef.current) {
      return;
    }

    sourceArchitectureLoadedRef.current = true;

    void getDraftRequest(sourceArchitectureId).then(async (draft) => {
      core.setDraftId(draft.draftId);
      core.setDraftStatus(draft.status);
      core.setLinkedSpawnedRunId(architectureDraftSpawnedRunId(draft));
      applyAdmittedRequiredMustQuestionKeysFromDocument(draft.document);
      const formState = applyArchitectureCreationDraftToFormState(draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      core.setStructuredBrief(formState.structuredBrief);
      setActorSet(
        draft.document.actorSet.actors.length > 0
          ? draft.document.actorSet
          : architectureCreationDefaultActorSet(),
      );

      const spawnedRunId = architectureDraftSpawnedRunId(draft);

      if (isGuidedIntakeAccessBlocked(draft.status)) {
        core.setSourceArchitectureAccessBlocked(true);
        showSuccess(
          spawnedRunId !== null
            ? "This architecture already has a review — opening it now."
            : "This architecture already started a review — returning to the architecture draft.",
        );
        navigate(resolveGuidedIntakeBlockedRedirectHref(sourceArchitectureId, spawnedRunId));

        return;
      }

      if (draft.status === "Admitted") {
        const questions = await getDraftQuestions(draft.draftId);
        core.setAllQuestions(questions.selection.allQuestions);
        core.setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
        core.setPendingQuestions(questions.selection.pendingMustQuestions);
        setStep(1);

        return;
      }
    });
  }, [
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    core,
    isCreateArchitectureFlow,
    navigate,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setStep,
    setSystemName,
    sourceArchitectureId,
  ]);

  useEffect(() => {
    if (core.draftId === null || core.draftStatus !== null) {
      return;
    }

    void getDraftRequest(core.draftId).then((draft) => {
      core.setDraftStatus(draft.status);
    });
  }, [core]);

  const refreshQuestions = useCallback(async (id: string) => {
    const questions = await getDraftQuestions(id);
    core.setAllQuestions(questions.selection.allQuestions);
    core.setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
    core.setPendingQuestions(questions.selection.pendingMustQuestions);
  }, [core]);

  const applyBranchDraft = useCallback(
    async (response: BranchDraftResponse) => {
      const branch = response.branch;
      core.setDraftId(branch.draftId);
      core.setDraftStatus(branch.status);
      core.setParentDraftId(response.parentDraftId);
      core.setParentSpawnedRunId(response.parentSpawnedRunId ?? null);
      setFreeTextIntent(branch.document.freeTextIntent);
      setBusinessOutcome(branch.document.businessOutcome ?? "");
      setSystemName(branch.document.systemName ?? "");
      setActorSet(
        branch.document.actorSet.actors.length > 0
          ? branch.document.actorSet
          : { actors: [] },
      );
      core.setAnswers({});
      core.setSavedLocallyQuestionKeys(new Set());
      applyAdmittedRequiredMustQuestionKeysFromDocument(branch.document);
      await refreshQuestions(branch.draftId);
      showSuccess("What-if branch created — you are now editing the branch draft.");
    },
    [applyAdmittedRequiredMustQuestionKeysFromDocument, core, refreshQuestions, setActorSet, setBusinessOutcome, setFreeTextIntent, setSystemName],
  );

  const runCreateArchitectureContinuation = useCallback(async () => {
    core.setBusy(true);
    core.setSubmitError(null);

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
        writeArchitectureCreationDraftId(id);
      }

      await patchDraftRequest(id, {
        freeTextIntent: briefTextForAdmission(),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: CREATE_ARCHITECTURE_INTENT,
        structuredBrief: structuredBriefToPatchPayload(core.structuredBrief),
      });

      const questions = await getDraftQuestions(id);
      core.setAllQuestions(questions.selection.allQuestions);
      core.setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
      core.setPendingQuestions(questions.selection.pendingMustQuestions);
      core.setSavedLocallyQuestionKeys(new Set());
      core.setViewAllClarifications(false);
      setStep(1);
      showSuccess("Continue with the architecture discovery questions.");
    } catch (error) {
      core.setSubmitError(error);

      if (isApiRequestError(error)) {
        showError("Architecture creation", error.message);
      }
    } finally {
      core.setBusy(false);
    }
  }, [
    actorSet,
    briefTextForAdmission,
    businessOutcome,
    core,
    focusedPilotModeEnabled,
    freeTextIntent,
    isCreateArchitectureFlow,
    priorRunId,
    setStep,
    systemName,
  ]);

  return {
    refreshQuestions,
    applyBranchDraft,
    runCreateArchitectureContinuation,
    applyAdmittedRequiredMustQuestionKeysFromDocument,
  };
}
