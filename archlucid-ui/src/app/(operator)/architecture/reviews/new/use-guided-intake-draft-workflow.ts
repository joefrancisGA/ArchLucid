"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import {
  emptyArchitectureDraftStructuredBrief,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { isGuidedIntakeDraftSubmitBlocked } from "@/lib/architecture/architecture-draft-intake-mode";
import { resolveGuidedIntakeClarificationProgress } from "@/lib/guided-intake-clarification-progress";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { DraftElicitationQuestion, DraftRequestStatus } from "@/types/draft-intake";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import type { GuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import { useGuidedIntakeDraftAdmit } from "./use-guided-intake-draft-admit";
import { useGuidedIntakeDraftCreate } from "./use-guided-intake-draft-create";
import { useGuidedIntakeDraftSubmit } from "./use-guided-intake-draft-submit";

type GuidedIntakeDraftWorkflowOptions = {
  readonly form: GuidedIntakeBriefForm;
  readonly isCreateArchitectureFlow: boolean;
  readonly sourceArchitectureId: string;
  readonly priorRunId?: string | null;
  readonly setStep: (stepIndex: number) => void;
  readonly navigate: (href: string) => void;
  readonly clearSession: () => void;
};

export type GuidedIntakeDraftCoreState = {
  readonly busy: boolean;
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly submitError: unknown | null;
  readonly setSubmitError: Dispatch<SetStateAction<unknown | null>>;
  readonly draftId: string | null;
  readonly setDraftId: Dispatch<SetStateAction<string | null>>;
  readonly draftStatus: DraftRequestStatus | null;
  readonly setDraftStatus: Dispatch<SetStateAction<DraftRequestStatus | null>>;
  readonly linkedSpawnedRunId: string | null;
  readonly setLinkedSpawnedRunId: Dispatch<SetStateAction<string | null>>;
  readonly sourceArchitectureAccessBlocked: boolean;
  readonly setSourceArchitectureAccessBlocked: Dispatch<SetStateAction<boolean>>;
  readonly parentDraftId: string | null;
  readonly setParentDraftId: Dispatch<SetStateAction<string | null>>;
  readonly parentSpawnedRunId: string | null;
  readonly setParentSpawnedRunId: Dispatch<SetStateAction<string | null>>;
  readonly redirectReason: string | null;
  readonly setRedirectReason: Dispatch<SetStateAction<string | null>>;
  readonly redirectVerdict: ManifestFeasibilityVerdict | null;
  readonly setRedirectVerdict: Dispatch<SetStateAction<ManifestFeasibilityVerdict | null>>;
  readonly allQuestions: DraftElicitationQuestion[];
  readonly setAllQuestions: Dispatch<SetStateAction<DraftElicitationQuestion[]>>;
  readonly requiredMustQuestionKeys: string[];
  readonly setRequiredMustQuestionKeys: Dispatch<SetStateAction<string[]>>;
  readonly admittedRequiredMustQuestionKeys: string[];
  readonly setAdmittedRequiredMustQuestionKeys: Dispatch<SetStateAction<string[]>>;
  readonly pendingQuestions: DraftElicitationQuestion[];
  readonly setPendingQuestions: Dispatch<SetStateAction<DraftElicitationQuestion[]>>;
  readonly answers: Record<string, string>;
  readonly setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  readonly savedLocallyQuestionKeys: ReadonlySet<string>;
  readonly setSavedLocallyQuestionKeys: Dispatch<SetStateAction<ReadonlySet<string>>>;
  readonly viewAllClarifications: boolean;
  readonly setViewAllClarifications: Dispatch<SetStateAction<boolean>>;
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly setStructuredBrief: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
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

  const core: GuidedIntakeDraftCoreState = {
    busy,
    setBusy,
    submitError,
    setSubmitError,
    draftId,
    setDraftId,
    draftStatus,
    setDraftStatus,
    linkedSpawnedRunId,
    setLinkedSpawnedRunId,
    sourceArchitectureAccessBlocked,
    setSourceArchitectureAccessBlocked,
    parentDraftId,
    setParentDraftId,
    parentSpawnedRunId,
    setParentSpawnedRunId,
    redirectReason,
    setRedirectReason,
    redirectVerdict,
    setRedirectVerdict,
    allQuestions,
    setAllQuestions,
    requiredMustQuestionKeys,
    setRequiredMustQuestionKeys,
    admittedRequiredMustQuestionKeys,
    setAdmittedRequiredMustQuestionKeys,
    pendingQuestions,
    setPendingQuestions,
    answers,
    setAnswers,
    savedLocallyQuestionKeys,
    setSavedLocallyQuestionKeys,
    viewAllClarifications,
    setViewAllClarifications,
    structuredBrief,
    setStructuredBrief,
  };

  const {
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    applyBranchDraft,
    refreshQuestions,
    runCreateArchitectureContinuation,
  } = useGuidedIntakeDraftCreate({
    core,
    form,
    isCreateArchitectureFlow,
    navigate,
    priorRunId,
    setStep,
    sourceArchitectureId,
  });

  const { reviewAnswers, runAdmission, saveAndContinue, skipQuestion } = useGuidedIntakeDraftAdmit({
    applyAdmittedRequiredMustQuestionKeysFromDocument,
    core,
    form,
    isCreateArchitectureFlow,
    priorRunId,
    refreshQuestions,
    setStep,
  });

  const { submitDraft } = useGuidedIntakeDraftSubmit({
    clearSession,
    core,
    form,
    isCreateArchitectureFlow,
    navigate,
  });

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
