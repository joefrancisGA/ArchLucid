"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  admitDraftRequest,
  answerDraftQuestion,
  createDraftRequest,
  getDraftQuestions,
  getDraftRequest,
  patchDraftRequest,
  skipDraftQuestion,
  submitDraftRequest,
} from "@/lib/api/draft-intake-api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  architectureCreationDefaultActorSet,
  applyArchitectureCreationDraftToFormState,
  initializeArchitectureCreation,
} from "@/lib/architecture/architecture-creation-init";
import {
  emptyArchitectureDraftStructuredBrief,
  structuredBriefToPatchPayload,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  buildArchitectureDraftRegistryEntry,
  upsertArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { recordArchitectureCreationHandoff } from "@/lib/architecture/architecture-creation-handoff";
import { writeArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";
import {
  CREATE_ARCHITECTURE_INTENT,
  START_REVIEW_INTENT,
} from "@/lib/architecture/architecture-workflow-intent";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { normalizeActorSetForAdmission } from "@/lib/draft-intake-actor-suggestions";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { GUIDED_INTAKE_READINESS_SUCCESS_TOAST } from "@/lib/guided-intake-copy";
import { isGuidedIntakeAccessBlocked, isGuidedIntakeDraftSubmitBlocked, resolveGuidedIntakeBlockedRedirectHref } from "@/lib/architecture/architecture-draft-intake-mode";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  mergeAdmittedRequiredMustQuestionKeys,
  resolveGuidedIntakeClarificationProgress,
} from "@/lib/guided-intake-clarification-progress";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import { showError, showSuccess } from "@/lib/toast";
import type { BranchDraftResponse, DraftElicitationQuestion, DraftRequestStatus } from "@/types/draft-intake";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";

type GuidedIntakeDraftWorkflowOptions = {
  readonly form: GuidedIntakeBriefForm;
  readonly isCreateArchitectureFlow: boolean;
  readonly sourceArchitectureId: string;
  readonly priorRunId?: string | null;
  readonly setStep: (stepIndex: number) => void;
  readonly navigate: (href: string) => void;
  readonly clearSession: () => void;
};

/**
 * Every server-side step of guided intake: create, patch, admit, answer, skip, submit — plus the
 * question set those calls return.
 *
 * Separated from the brief form because this half is a request pipeline with its own busy/error
 * state, and the ordering rules that matter here (a draft is immutable once admitted, so the brief
 * must be patched before admission) live entirely inside these actions.
 */
export type GuidedIntakeDraftWorkflow = ReturnType<typeof useGuidedIntakeDraftWorkflow>;

export function useGuidedIntakeDraftWorkflow(options: GuidedIntakeDraftWorkflowOptions) {
  const {
    clearSession,
    form,
    isCreateArchitectureFlow,
    navigate,
    priorRunId,
    setStep,
    sourceArchitectureId,
  } = options;

  const [busy, setBusy] = useState(false);
  const [sourceArchitectureAccessBlocked, setSourceArchitectureAccessBlocked] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftRequestStatus | null>(null);
  const [linkedSpawnedRunId, setLinkedSpawnedRunId] = useState<string | null>(null);
  const [parentDraftId, setParentDraftId] = useState<string | null>(null);
  const [parentSpawnedRunId, setParentSpawnedRunId] = useState<string | null>(null);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const [redirectVerdict, setRedirectVerdict] = useState<ManifestFeasibilityVerdict | null>(null);
  const [allQuestions, setAllQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [requiredMustQuestionKeys, setRequiredMustQuestionKeys] = useState<string[]>([]);
  const [admittedRequiredMustQuestionKeys, setAdmittedRequiredMustQuestionKeys] = useState<string[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedLocallyQuestionKeys, setSavedLocallyQuestionKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [viewAllClarifications, setViewAllClarifications] = useState(false);
  const [structuredBrief, setStructuredBrief] = useState<ArchitectureDraftStructuredBriefState>(
    () => emptyArchitectureDraftStructuredBrief(),
  );
  const creationInitStartedRef = useRef(false);
  const sourceArchitectureLoadedRef = useRef(false);

  const applyAdmittedRequiredMustQuestionKeysFromDocument = useCallback(
    (document: { requiredMustQuestionKeys?: string[] } | undefined) => {
      setAdmittedRequiredMustQuestionKeys((current) =>
        mergeAdmittedRequiredMustQuestionKeys(current, document?.requiredMustQuestionKeys),
      );
    },
    [],
  );

  const {
    actorSet,
    businessOutcome,
    focusedPilotModeEnabled,
    freeTextIntent,
    setActorSet,
    setBusinessOutcome,
    setFreeTextIntent,
    setSystemName,
    systemName,
    briefTextForAdmission,
  } = form;

  useEffect(() => {
    if (!isCreateArchitectureFlow || creationInitStartedRef.current) {
      return;
    }

    creationInitStartedRef.current = true;

    void initializeArchitectureCreation().then(async (result) => {
      if (result.draftId !== null) {
        setDraftId(result.draftId);
        setDraftStatus(result.draft?.status ?? null);
        await patchDraftRequest(result.draftId, { workflowIntent: CREATE_ARCHITECTURE_INTENT });
      }

      const formState = applyArchitectureCreationDraftToFormState(result.draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      setStructuredBrief(formState.structuredBrief);
      setAllQuestions([...result.questionSelection.allQuestions]);
      setRequiredMustQuestionKeys([...result.questionSelection.requiredMustQuestionKeys]);
      setPendingQuestions([...result.questionSelection.pendingMustQuestions]);
      applyAdmittedRequiredMustQuestionKeysFromDocument(result.draft?.document);
    });
  }, [
    applyAdmittedRequiredMustQuestionKeysFromDocument,
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
      setDraftId(draft.draftId);
      setDraftStatus(draft.status);
      setLinkedSpawnedRunId(architectureDraftSpawnedRunId(draft));
      applyAdmittedRequiredMustQuestionKeysFromDocument(draft.document);
      const formState = applyArchitectureCreationDraftToFormState(draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      setStructuredBrief(formState.structuredBrief);
      setActorSet(
        draft.document.actorSet.actors.length > 0
          ? draft.document.actorSet
          : architectureCreationDefaultActorSet(),
      );

      const spawnedRunId = architectureDraftSpawnedRunId(draft);

      if (isGuidedIntakeAccessBlocked(draft.status)) {
        setSourceArchitectureAccessBlocked(true);
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
        setAllQuestions(questions.selection.allQuestions);
        setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
        setPendingQuestions(questions.selection.pendingMustQuestions);
        setStep(1);

        return;
      }
    });
  }, [
    applyAdmittedRequiredMustQuestionKeysFromDocument,
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
    if (draftId === null || draftStatus !== null) {
      return;
    }

    void getDraftRequest(draftId).then((draft) => {
      setDraftStatus(draft.status);
    });
  }, [draftId, draftStatus]);

  const refreshQuestions = useCallback(async (id: string) => {
    const questions = await getDraftQuestions(id);
    setAllQuestions(questions.selection.allQuestions);
    setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
    setPendingQuestions(questions.selection.pendingMustQuestions);
  }, []);

  const applyBranchDraft = useCallback(
    async (response: BranchDraftResponse) => {
      const branch = response.branch;
      setDraftId(branch.draftId);
      setDraftStatus(branch.status);
      setParentDraftId(response.parentDraftId);
      setParentSpawnedRunId(response.parentSpawnedRunId ?? null);
      setFreeTextIntent(branch.document.freeTextIntent);
      setBusinessOutcome(branch.document.businessOutcome ?? "");
      setSystemName(branch.document.systemName ?? "");
      setActorSet(
        branch.document.actorSet.actors.length > 0
          ? branch.document.actorSet
          : { actors: [] },
      );
      setAnswers({});
      setSavedLocallyQuestionKeys(new Set());
      applyAdmittedRequiredMustQuestionKeysFromDocument(branch.document);
      await refreshQuestions(branch.draftId);
      showSuccess("What-if branch created — you are now editing the branch draft.");
    },
    [applyAdmittedRequiredMustQuestionKeysFromDocument, refreshQuestions, setActorSet, setBusinessOutcome, setFreeTextIntent, setSystemName],
  );

  const runCreateArchitectureContinuation = useCallback(async () => {
    setBusy(true);
    setSubmitError(null);

    try {
      let id = draftId;

      if (id === null) {
        const created = await createDraftRequest(
          freeTextIntent.trim(),
          isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
          priorRunId,
        );
        id = created.draftId;
        setDraftId(id);
        setDraftStatus(created.status);
        writeArchitectureCreationDraftId(id);
      }

      await patchDraftRequest(id, {
        freeTextIntent: briefTextForAdmission(),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: CREATE_ARCHITECTURE_INTENT,
        structuredBrief: structuredBriefToPatchPayload(structuredBrief),
      });

      const questions = await getDraftQuestions(id);
      setAllQuestions(questions.selection.allQuestions);
      setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
      setPendingQuestions(questions.selection.pendingMustQuestions);
      setSavedLocallyQuestionKeys(new Set());
      setViewAllClarifications(false);
      setStep(1);
      showSuccess("Continue with the architecture discovery questions.");
    } catch (error) {
      setSubmitError(error);

      if (isApiRequestError(error)) {
        showError("Architecture creation", error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [
    actorSet,
    briefTextForAdmission,
    businessOutcome,
    draftId,
    focusedPilotModeEnabled,
    freeTextIntent,
    isCreateArchitectureFlow,
    setStep,
    structuredBrief,
    systemName,
  ]);

  const runAdmission = useCallback(async () => {
    setBusy(true);
    setSubmitError(null);
    setRedirectReason(null);
    setRedirectVerdict(null);

    try {
      let id = draftId;

      if (id === null) {
        const created = await createDraftRequest(
          freeTextIntent.trim(),
          isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
          priorRunId,
        );
        id = created.draftId;
        setDraftId(id);
        setDraftStatus(created.status);
      }

      // Confirmed scope goes onto the server copy of the brief before admission: a draft is immutable
      // once admitted, and the admission gate must see the same text the reviewer will read.
      await patchDraftRequest(id, {
        freeTextIntent: briefTextForAdmission(),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
        structuredBrief: structuredBriefToPatchPayload(structuredBrief),
      });

      const admission = await admitDraftRequest(id);

      if (!admission.admitted) {
        setRedirectReason(admission.redirectReason ?? admission.verdict.summary);
        setRedirectVerdict(admission.verdict);
        showError(
          REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
          admission.redirectReason ?? "Readiness checks redirected this draft.",
        );

        return;
      }

      setPendingQuestions(admission.pendingMustQuestions);
      setRequiredMustQuestionKeys(admission.requiredMustQuestionKeys);
      setDraftStatus(admission.status);
      applyAdmittedRequiredMustQuestionKeysFromDocument(admission.draft.document);
      setSavedLocallyQuestionKeys(new Set());
      await refreshQuestions(id);
      setViewAllClarifications(false);
      setStep(1);
      const admittedDraft = await getDraftRequest(id);
      applyAdmittedRequiredMustQuestionKeysFromDocument(admittedDraft.document);
      upsertArchitectureDraftRegistryEntry(buildArchitectureDraftRegistryEntry(admittedDraft));
      showSuccess(GUIDED_INTAKE_READINESS_SUCCESS_TOAST);
    } catch (error) {
      setSubmitError(error);

      if (isApiRequestError(error)) {
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [
    actorSet,
    briefTextForAdmission,
    businessOutcome,
    draftId,
    focusedPilotModeEnabled,
    freeTextIntent,
    isCreateArchitectureFlow,
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    refreshQuestions,
    setStep,
    structuredBrief,
    systemName,
  ]);

  const reviewAnswers = useCallback(async () => {
    if (draftId === null) {
      return;
    }

    const unresolvedQuestions = pendingQuestions.filter(
      (question) => !savedLocallyQuestionKeys.has(question.questionKey),
    );

    if (unresolvedQuestions.length > 0) {
      return;
    }

    setBusy(true);
    setSubmitError(null);

    try {
      // Persist only locally saved answers. API skips are already recorded; empty
      // saved keys mean skip (or a stale pending row after skip refresh lag).
      for (const question of pendingQuestions) {
        if (!savedLocallyQuestionKeys.has(question.questionKey)) {
          continue;
        }

        const answer = answers[question.questionKey]?.trim() ?? "";

        if (answer.length === 0) {
          continue;
        }

        await answerDraftQuestion(draftId, question.questionKey, answer);
      }

      await refreshQuestions(draftId);
      setSavedLocallyQuestionKeys(new Set());
      setStep(2);
    } catch (error) {
      setSubmitError(error);

      if (isApiRequestError(error)) {
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [answers, draftId, pendingQuestions, refreshQuestions, savedLocallyQuestionKeys, setStep]);

  const saveAndContinue = useCallback(
    (questionKey: string) => {
      const answer = answers[questionKey]?.trim() ?? "";

      if (answer.length === 0) {
        return;
      }

      setSavedLocallyQuestionKeys((current) => {
        const next = new Set(current);
        next.add(questionKey);

        return next;
      });
    },
    [answers],
  );

  const skipQuestion = useCallback(
    async (questionKey: string) => {
      if (draftId === null) {
        setSubmitError(new Error("Draft is not ready yet. Go back and continue from the brief step."));
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, "Draft is not ready yet. Continue from the brief step first.");

        return;
      }

      setBusy(true);
      setSubmitError(null);

      try {
        await skipDraftQuestion(draftId, questionKey);
        // Mark handled locally before refresh so Review answers enables even when
        // GET questions briefly still lists the skipped MUST (live e2e / lag).
        setSavedLocallyQuestionKeys((current) => {
          const next = new Set(current);
          next.add(questionKey);

          return next;
        });
        await refreshQuestions(draftId);
        showSuccess("Question skipped — recorded on the transparency trail.");
      } catch (error) {
        setSubmitError(error);

        if (isApiRequestError(error)) {
          showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [draftId, refreshQuestions],
  );

  const submitDraft = useCallback(async () => {
    if (draftId === null) {
      return;
    }

    setBusy(true);
    setSubmitError(null);

    try {
      const result = await submitDraftRequest(draftId);
      const submittedDraft = await getDraftRequest(draftId);
      setDraftStatus(submittedDraft.status);
      setLinkedSpawnedRunId(architectureDraftSpawnedRunId(submittedDraft));
      upsertArchitectureDraftRegistryEntry(
        buildArchitectureDraftRegistryEntry(submittedDraft, { linkedReviewId: result.runId }),
      );
      recordFirstTenantFunnelEvent("first_run_started");
      trackReviewPipelineInFlight(result.runId);
      clearSession();

      const compareParentRunId = result.parentSpawnedRunId ?? parentSpawnedRunId;

      if (compareParentRunId !== null && compareParentRunId.trim().length > 0) {
        showSuccess("What-if branch review started — open Compare when both reviews are ready.");
        navigate(runDetailHrefWithParentRun(result.runId, compareParentRunId));

        return;
      }

      showSuccess(
        isCreateArchitectureFlow
          ? "Architecture draft created — opening your architecture workspace."
          : "Architecture review started from guided intake.",
      );

      if (isCreateArchitectureFlow) {
        recordArchitectureCreationHandoff({
          runId: result.runId,
          architectureName: systemName.trim(),
          architectureOverview: freeTextIntent.trim(),
          businessOutcome: businessOutcome.trim(),
          peopleAndSystems: actorSet.actors.map((actor) => ({
            label: actor.label?.trim() || actor.kind,
            kind: actor.kind,
          })),
        });
      }

      navigate(
        buildReviewGenerationRedirect(
          result.runId,
          isCreateArchitectureFlow ? "create-architecture" : "socratic-intake",
          { architectureCreation: isCreateArchitectureFlow },
        ),
      );
    } catch (error) {
      // Inline only: the failure belongs beside the button that produced it, not in a toast the
      // operator has to read before it disappears.
      setSubmitError(error);
    } finally {
      setBusy(false);
    }
  }, [
    actorSet.actors,
    businessOutcome,
    clearSession,
    draftId,
    freeTextIntent,
    isCreateArchitectureFlow,
    navigate,
    parentSpawnedRunId,
    systemName,
  ]);

  const activePendingQuestions = useMemo(
    () => pendingQuestions.filter((question) => !savedLocallyQuestionKeys.has(question.questionKey)),
    [pendingQuestions, savedLocallyQuestionKeys],
  );
  const clarificationProgress = resolveGuidedIntakeClarificationProgress({
    admittedRequiredMustQuestionKeys,
    pendingSelectionRequiredKeys: requiredMustQuestionKeys,
    allQuestions,
    activePendingCount: activePendingQuestions.length,
  });
  const totalRequiredClarifications = clarificationProgress.totalRequired;
  const handledClarificationCount = clarificationProgress.handledCount;
  const clarificationOrdinalByKey = useMemo(() => {
    const orderedKeys =
      admittedRequiredMustQuestionKeys.length > 0
        ? admittedRequiredMustQuestionKeys
        : requiredMustQuestionKeys.length > 0
          ? requiredMustQuestionKeys
          : allQuestions.filter((question) => question.tier === "Must").map((question) => question.questionKey);
    const ordinals = new Map<string, number>();

    orderedKeys.forEach((questionKey, index) => {
      ordinals.set(questionKey, index + 1);
    });

    return ordinals;
  }, [admittedRequiredMustQuestionKeys, allQuestions, requiredMustQuestionKeys]);
  const getClarificationOrdinal = useCallback(
    (questionKey: string): number => clarificationOrdinalByKey.get(questionKey) ?? 0,
    [clarificationOrdinalByKey],
  );
  const getClarificationStatus = useCallback(
    (questionKey: string): { kind: EnterpriseStatusKind; label: string } | undefined => {
      if (savedLocallyQuestionKeys.has(questionKey)) {
        const answer = answers[questionKey]?.trim() ?? "";

        if (answer.length > 0) {
          return { kind: "ready", label: "Answered" };
        }

        return { kind: "draft", label: "Skipped" };
      }

      return undefined;
    },
    [answers, savedLocallyQuestionKeys],
  );
  const primaryPendingQuestion = activePendingQuestions[0] ?? null;
  const otherPendingQuestions =
    viewAllClarifications && activePendingQuestions.length > 1 ? activePendingQuestions.slice(1) : [];
  const allClarificationsHandled =
    pendingQuestions.length === 0 ||
    pendingQuestions.every((question) => savedLocallyQuestionKeys.has(question.questionKey));
  const isSubmitBlocked = isGuidedIntakeDraftSubmitBlocked(draftStatus);

  return {
    busy,
    submitError,
    draftId,
    draftStatus,
    setDraftId,
    linkedSpawnedRunId,
    sourceArchitectureAccessBlocked,
    isSubmitBlocked,
    parentDraftId,
    parentSpawnedRunId,
    redirectReason,
    redirectVerdict,
    allQuestions,
    pendingQuestions,
    answers,
    setAnswers,
    viewAllClarifications,
    setViewAllClarifications,
    totalRequiredClarifications,
    activePendingQuestions,
    handledClarificationCount,
    getClarificationOrdinal,
    getClarificationStatus,
    primaryPendingQuestion,
    otherPendingQuestions,
    allClarificationsHandled,
    applyBranchDraft,
    runAdmission,
    runCreateArchitectureContinuation,
    reviewAnswers,
    saveAndContinue,
    skipQuestion,
    submitDraft,
  };
}
