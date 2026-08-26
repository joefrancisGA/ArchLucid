"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CLOUD_TARGET_QUESTION_KEY } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useInferredUniversalIntakeAnswers } from "@/hooks/use-inferred-universal-intake-answers";
import { useReviewsNewSuppressWizardResumePrompt } from "@/hooks/use-reviews-new-suppress-wizard-resume-prompt";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture/architecture-request-limits";
import {
  mergeScopeBulletsIntoBrief,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import { deriveEvidencePresenceFromFileNames } from "@/lib/evidence-gap-forecast";
import { evidenceFilesIncludeBinaryArchitectureDocument } from "@/lib/evidence-readable-text";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { readIncrementalRereviewFromSearch } from "@/lib/review-quality/incremental-rereview-handoff";
import { evaluatePolicyPackCloudMismatch } from "@/lib/review-quality/review-intake-quality-gates";
import { priorPackageInheritedTitle, readPriorRunIdFromSearch } from "@/lib/second-review-prior-package";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import {
  buildEvidenceBackedIntakeBrief,
  describeFirstPilotStartBlocker,
  FIRST_PILOT_MIN_BRIEF_CHARS,
  formatFirstPilotIntakeWriteDestination,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";
import {
  needsQuickStartLimitedEvidenceAcknowledgment,
  type QuickStartAnalyzableEvidenceInput,
} from "@/lib/first-pilot-analyzable-evidence";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";
import { projectUniversalIntakeAnswersOntoCreateRunPayload } from "@/lib/universal-intake-answer-projection";
import { buildIntakeTransparencyTrail } from "@/lib/universal-intake-must-completeness";
import { WIZARD_SESSION_IDS, wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

import { buildFirstPilotPayload, FIRST_PILOT_REQUIRED_CAPABILITIES } from "./first-pilot-intake-payload";
import { useFirstPilotIntakeSubmit } from "./use-first-pilot-intake-submit";

type FirstPilotIntakeSessionState = {
  readonly runTitle: string;
  readonly briefText: string;
  readonly focusedPilotModeEnabled: boolean;
  readonly l0Answers: Readonly<Record<string, string>>;
  readonly l0SkippedQuestionKeys: readonly string[];
};

export type FirstPilotIntakeWizardProps = {
  readonly onRunCreatedNavigate?: (runId: string) => void;
};

export function useFirstPilotIntakeWizard(props: FirstPilotIntakeWizardProps) {
  const { onRunCreatedNavigate } = props;
  const searchParams = useSearchParams();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const exampleTemplatePrefillAppliedRef = useRef(false);
  const priorPackagePrefillAppliedRef = useRef(false);
  const priorRunId = useMemo(() => readPriorRunIdFromSearch(searchParams), [searchParams]);
  const incrementalRereview = useMemo(
    () => readIncrementalRereviewFromSearch(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );
  const [inheritedPriorTitle, setInheritedPriorTitle] = useState<string | null>(null);

  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).template,
    [searchParams],
  );

  const [runTitle, setRunTitle] = useState("");
  const [briefText, setBriefText] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [limitedEvidenceAnalysisAcknowledged, setLimitedEvidenceAnalysisAcknowledged] = useState(false);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [l0Answers, setL0Answers] = useState<Readonly<Record<string, string>>>({});
  const [l0SkippedQuestionKeys, setL0SkippedQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const {
    inferredQuestionKeys: inferredL0QuestionKeys,
    isExtractingEvidenceText,
    clarificationSuggestionsUnavailable,
    canSuggestFromEvidence,
    suggestAnswersFromEvidence,
    markQuestionEdited: markL0QuestionEdited,
  } = useInferredUniversalIntakeAnswers({
    briefText,
    evidenceFiles,
    answers: l0Answers,
    onAnswersChange: setL0Answers,
    blocksLlmRephrase: blocksLlmExecution,
  });
  const [scopeGateOpen, setScopeGateOpen] = useState(false);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const [writeDestination, setWriteDestination] = useState(() =>
    formatFirstPilotIntakeWriteDestination(readActiveTenantContext()),
  );
  const creationProgress = useReviewCreationProgress();
  const sessionState = useMemo<FirstPilotIntakeSessionState>(
    () => ({
      runTitle,
      briefText,
      focusedPilotModeEnabled,
      l0Answers,
      l0SkippedQuestionKeys: [...l0SkippedQuestionKeys],
    }),
    [briefText, focusedPilotModeEnabled, l0Answers, l0SkippedQuestionKeys, runTitle],
  );
  const handleSessionRestore = useCallback((snapshot: { state: FirstPilotIntakeSessionState }) => {
    setRunTitle(snapshot.state.runTitle);
    setBriefText(snapshot.state.briefText);
    setFocusedPilotModeEnabled(snapshot.state.focusedPilotModeEnabled);
    setL0Answers(snapshot.state.l0Answers);
    setL0SkippedQuestionKeys(new Set(snapshot.state.l0SkippedQuestionKeys));
  }, []);
  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewQuickStart,
    stepIndex: 0,
    state: sessionState,
    hasSaveableContent: (state) =>
      wizardSessionHasTextContent(state.runTitle) || wizardSessionHasTextContent(state.briefText),
    onRestore: handleSessionRestore,
  });
  const suppressWizardResumePrompt = useReviewsNewSuppressWizardResumePrompt();

  useEffect(() => {
    const refreshWriteDestination = () => {
      setWriteDestination(formatFirstPilotIntakeWriteDestination(readActiveTenantContext()));
    };

    refreshWriteDestination();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshWriteDestination);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, refreshWriteDestination);
    };
  }, []);

  useEffect(() => {
    if (exampleTemplate === null || exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    exampleTemplatePrefillAppliedRef.current = true;
    setRunTitle(exampleTemplate.title);
    setBriefText(exampleTemplate.briefText);
  }, [exampleTemplate]);

  const priorSummaryQuery = useRunSummaryQuery(priorRunId ?? "", {
    enabled: priorRunId !== null,
  });

  useEffect(() => {
    if (priorRunId === null || priorPackagePrefillAppliedRef.current || priorSummaryQuery.data === undefined) {
      return;
    }

    priorPackagePrefillAppliedRef.current = true;
    const inheritedTitle = priorPackageInheritedTitle(priorSummaryQuery.data);

    if (inheritedTitle.length === 0) {
      return;
    }

    setInheritedPriorTitle(inheritedTitle);
    setRunTitle((current) => (current.trim().length > 0 ? current : inheritedTitle));
  }, [priorRunId, priorSummaryQuery.data]);

  const resolvedBrief = useMemo(
    () => buildEvidenceBackedIntakeBrief(runTitle, evidenceFiles, briefText),
    [briefText, evidenceFiles, runTitle],
  );
  const scopeUnderstandingInput = useMemo(
    () => ({
      architectureName: normalizeFirstPilotReviewTitle(runTitle),
      businessOutcome: briefText,
      architectureOverview: briefText,
    }),
    [briefText, runTitle],
  );
  const evidencePresence = useMemo(() => {
    const fileNames = evidenceFiles.map((file) => file.name);

    if (briefText.trim().length >= FIRST_PILOT_MIN_BRIEF_CHARS) {
      return deriveEvidencePresenceFromFileNames([...fileNames, "architecture-brief.md"]);
    }

    return deriveEvidencePresenceFromFileNames(fileNames);
  }, [briefText, evidenceFiles]);

  const evidenceFileNames = useMemo(() => evidenceFiles.map((file) => file.name), [evidenceFiles]);
  const showBinaryDocumentReadAfterUploadHelper = useMemo(
    () => evidenceFilesIncludeBinaryArchitectureDocument(evidenceFiles),
    [evidenceFiles],
  );
  const analyzableEvidenceInput = useMemo<QuickStartAnalyzableEvidenceInput>(
    () => ({
      operatorBrief: briefText,
      evidenceFileNames,
      limitedEvidenceAnalysisAcknowledged,
    }),
    [briefText, evidenceFileNames, limitedEvidenceAnalysisAcknowledged],
  );
  const showLimitedEvidenceAcknowledgment = useMemo(
    () => needsQuickStartLimitedEvidenceAcknowledgment(analyzableEvidenceInput),
    [analyzableEvidenceInput],
  );

  const intakeReadiness = {
    title: runTitle,
    brief: briefText,
    evidenceFileCount: evidenceFiles.length,
    evidenceFileNames,
    limitedEvidenceAnalysisAcknowledged,
    l0Must: {
      answers: l0Answers,
      skippedQuestionKeys: l0SkippedQuestionKeys,
    },
  };

  const policyReferences = useMemo(
    () => applyFocusedPilotModePolicyReferences([], focusedPilotModeEnabled),
    [focusedPilotModeEnabled],
  );
  const cloudTargetAnswer = l0Answers[CLOUD_TARGET_QUESTION_KEY]?.trim() ?? "";
  const cloudTargetForMismatch =
    cloudTargetAnswer === ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL || cloudTargetAnswer.length === 0
      ? "none"
      : cloudTargetAnswer.toLowerCase();
  const policyPackCloudMismatch = evaluatePolicyPackCloudMismatch(cloudTargetForMismatch, policyReferences);

  const startBlockerInput = useMemo(
    () => ({
      intake: intakeReadiness,
      policyPackCloudMismatch,
      scopeGateOpen,
      briefExceedsMaxLength: resolvedBrief.length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH,
      maxBriefLength: ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH,
    }),
    [intakeReadiness, policyPackCloudMismatch, resolvedBrief.length, scopeGateOpen],
  );

  const startBlocker = describeFirstPilotStartBlocker(startBlockerInput);

  const canStart = startBlocker === null && !creationProgress.isActive && !blocksLlmExecution;

  const buildSubmitBody = useCallback(
    (filesToUpload: readonly File[]): CreateArchitectureRunRequestPayload => {
      const briefWithScope = mergeScopeBulletsIntoBrief(scopeBullets, resolvedBrief);
      const intakeTransparencyTrail = buildIntakeTransparencyTrail(l0SkippedQuestionKeys);
      const basePayload = buildFirstPilotPayload(
        runTitle,
        briefWithScope,
        FIRST_PILOT_REQUIRED_CAPABILITIES,
        focusedPilotModeEnabled,
      );

      return projectUniversalIntakeAnswersOntoCreateRunPayload(
        basePayload,
        l0Answers,
        l0SkippedQuestionKeys,
        intakeTransparencyTrail,
        {
          pendingEvidenceFileNames: filesToUpload.map((file) => file.name),
          limitedEvidenceAnalysisAcknowledged,
          operatorBriefCharacterCount: briefText.trim().length,
        },
      );
    },
    [
      briefText,
      focusedPilotModeEnabled,
      l0Answers,
      l0SkippedQuestionKeys,
      limitedEvidenceAnalysisAcknowledged,
      resolvedBrief,
      runTitle,
      scopeBullets,
    ],
  );

  const { clientValidationMessage, setClientValidationMessage, submitRun, recheckUnresolvedRun } =
    useFirstPilotIntakeSubmit({
      startBlockerInput,
      canStart,
      resolvedBrief,
      evidenceFiles,
      setEvidenceFiles,
      exampleTemplate,
      buildSubmitBody,
      onRunCreatedNavigate,
      clearWizardSession: wizardSession.clearSession,
      creationProgress,
    });

  return {
    llmBudgetStatus,
    blocksLlmExecution,
    exampleTemplate,
    incrementalRereview,
    inheritedPriorTitle,
    runTitle,
    setRunTitle,
    briefText,
    setBriefText,
    evidenceFiles,
    setEvidenceFiles,
    limitedEvidenceAnalysisAcknowledged,
    setLimitedEvidenceAnalysisAcknowledged,
    focusedPilotModeEnabled,
    setFocusedPilotModeEnabled,
    l0Answers,
    setL0Answers,
    l0SkippedQuestionKeys,
    setL0SkippedQuestionKeys,
    inferredL0QuestionKeys,
    isExtractingEvidenceText,
    clarificationSuggestionsUnavailable,
    canSuggestFromEvidence,
    suggestAnswersFromEvidence,
    markL0QuestionEdited,
    scopeGateOpen,
    setScopeGateOpen,
    scopeBullets,
    setScopeBullets,
    scopeUnderstandingInput,
    writeDestination,
    creationProgress,
    wizardSession,
    suppressWizardResumePrompt,
    evidencePresence,
    evidenceFileNames,
    showBinaryDocumentReadAfterUploadHelper,
    showLimitedEvidenceAcknowledgment,
    policyPackCloudMismatch,
    startBlocker,
    clientValidationMessage,
    setClientValidationMessage,
    submitRun,
    recheckUnresolvedRun,
  };
}

export type FirstPilotIntakeWizardState = ReturnType<typeof useFirstPilotIntakeWizard>;
