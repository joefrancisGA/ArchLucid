"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
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
import { architectureDraftPath, SOURCE_ARCHITECTURE_QUERY_PARAM } from "@/lib/architecture-routes";
import { architectureDraftDisplayName } from "@/lib/architecture-draft-status";
import {
  architectureCreationDefaultActorSet,
  applyArchitectureCreationDraftToFormState,
  initializeArchitectureCreation,
} from "@/lib/architecture-creation-init";
import {
  CREATE_ARCHITECTURE_INTENT,
  isCreateArchitectureIntent,
  resolveArchitectureWorkflowIntent,
  START_REVIEW_INTENT,
} from "@/lib/architecture-workflow-intent";
import { writeArchitectureCreationDraftId } from "@/lib/architecture-creation-session";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { CREATE_ARCHITECTURE_STARTING_LABEL, REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { recordArchitectureCreationHandoff } from "@/lib/architecture-creation-handoff";
import {
  mergeScopeBulletsIntoBrief,
  scopeBriefLines,
  SCOPE_UNDERSTANDING_READY_TO_CONTINUE_HINT,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture-scope-understanding-check";
import { isApiRequestError } from "@/lib/api-request-error";
import { deriveEvidencePresenceFromFileNames } from "@/lib/evidence-gap-forecast";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WIZARD_STICKY_PROGRESS_CLASS,
  WIZARD_STICKY_PROGRESS_TEST_ID,
} from "@/lib/wizard-sticky-progress";
import { showError, showSuccess } from "@/lib/toast";
import type { WizardStepDefinition } from "@/lib/wizard-step-sequence";
import {
  normalizeActorSetForAdmission,
} from "@/lib/draft-intake-actor-suggestions";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL,
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS,
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
  GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING,
  GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS,
  GUIDED_INTAKE_CONTINUE_TO_DISCOVERY,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER,
  GUIDED_INTAKE_READINESS_SUCCESS_TOAST,
  GUIDED_INTAKE_REQUEST_FAILED_FALLBACK,
  GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER,
  GUIDED_INTAKE_STEP0_CARD_DESCRIPTION,
  GUIDED_INTAKE_STEP0_CARD_TITLE,
  GUIDED_INTAKE_STEP0_PROGRESS_LABEL,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL,
  GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
  GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
  GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD,
  buildGuidedIntakeCreationAdvanceBlockerMessage,
  guidedIntakeArchitectureIntentHelperText,
  guidedIntakeCreationArchitectureOverviewHelperText,
} from "@/lib/guided-intake-copy";
import type { ActorSet, BranchDraftResponse, DraftElicitationQuestion } from "@/types/draft-intake";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import { REVIEWS_NEW_GUIDED_QUESTIONS_LABEL } from "@/lib/reviews-new-path-copy";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { WIZARD_SESSION_IDS, wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

import {
  DraftIntakeDecisionReceiptCard,
  SocraticIntakeWizardAdvancedRail,
} from "./SocraticIntakeWizardDeferredPanels";

const MIN_INTENT_CHARS = GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_CHARS;
const MIN_OUTCOME_CHARS = 10;

type GuidedIntakeSessionState = {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
  readonly actorSet: ActorSet;
  readonly answers: Record<string, string>;
  readonly draftId: string | null;
};

const INTAKE_STEPS = [
  {
    progressLabel: GUIDED_INTAKE_STEP0_PROGRESS_LABEL,
    cardTitle: GUIDED_INTAKE_STEP0_CARD_TITLE,
    description: GUIDED_INTAKE_STEP0_CARD_DESCRIPTION,
  },
  {
    progressLabel: "Required clarifications",
    cardTitle: "Required clarifications",
    description: "Answer a few clarifying questions so ArchLucid can produce a precise review.",
  },
  {
    progressLabel: CREATE_REVIEW_PACKAGE_HEADING,
    cardTitle: CREATE_REVIEW_PACKAGE_HEADING,
    description: GUIDED_INTAKE_STEP2_CARD_DESCRIPTION,
  },
] as const;

const INTAKE_STEP_DEFINITIONS: readonly WizardStepDefinition[] = INTAKE_STEPS.map((step) => ({
  label: step.progressLabel,
  description: step.description,
}));

type IntakeFieldLabelProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
};

function IntakeFieldLabel(props: IntakeFieldLabelProps): React.JSX.Element {
  return (
    <Label
      htmlFor={props.htmlFor}
      className="font-semibold text-neutral-900 dark:text-neutral-100"
    >
      {props.label}
      <span
        className={cn(
          "font-normal text-neutral-500 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {props.required ? " (required)" : " (optional)"}
      </span>
    </Label>
  );
}

type GuidedIntakeRequestErrorProps = {
  readonly error: unknown;
};

/**
 * Keeps a failed request next to the control that triggered it. The wizard's primary CTA sits at the
 * bottom of a long step, so an error rendered at the page top lands off-screen on click.
 */
function GuidedIntakeRequestError(props: GuidedIntakeRequestErrorProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    // jsdom has no layout engine, so scrollIntoView is absent under unit tests.
    if (container === null || typeof container.scrollIntoView !== "function") {
      return;
    }

    container.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.error]);

  return (
    <div ref={containerRef} data-testid="guided-intake-request-error">
      <OperatorApiProblem
        problem={isApiRequestError(props.error) ? props.error.problem : null}
        fallbackMessage={
          isApiRequestError(props.error) ? props.error.message : GUIDED_INTAKE_REQUEST_FAILED_FALLBACK
        }
      />
    </div>
  );
}

export function SocraticIntakeWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const exampleTemplatePrefillAppliedRef = useRef(false);

  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).template,
    [searchParams],
  );

  const workflowIntent = useMemo(
    () => resolveArchitectureWorkflowIntent((key) => searchParams?.get(key) ?? null),
    [searchParams],
  );
  const isCreateArchitectureFlow = isCreateArchitectureIntent(workflowIntent);
  const creationInitStartedRef = useRef(false);
  const sourceArchitectureLoadedRef = useRef(false);
  const sourceArchitectureId = searchParams?.get(SOURCE_ARCHITECTURE_QUERY_PARAM)?.trim() ?? "";

  const {
    stepIndex: step,
    setStepIndex: setStep,
    goBack,
    goToStep,
  } = useWizardStepNavigation({
    steps: INTAKE_STEP_DEFINITIONS,
    telemetryWizardName: "SocraticIntake",
  });
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);

  const [freeTextIntent, setFreeTextIntent] = useState("");
  const [businessOutcome, setBusinessOutcome] = useState("");
  const [systemName, setSystemName] = useState("");
  const [actorSet, setActorSet] = useState<ActorSet>(() => ({ actors: [] }));

  const [draftId, setDraftId] = useState<string | null>(null);
  const [parentDraftId, setParentDraftId] = useState<string | null>(null);
  const [parentSpawnedRunId, setParentSpawnedRunId] = useState<string | null>(null);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const [redirectVerdict, setRedirectVerdict] = useState<ManifestFeasibilityVerdict | null>(null);
  const [allQuestions, setAllQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [requiredMustQuestionKeys, setRequiredMustQuestionKeys] = useState<string[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedLocallyQuestionKeys, setSavedLocallyQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [viewAllClarifications, setViewAllClarifications] = useState(false);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [scopeGateOpen, setScopeGateOpen] = useState(false);
  const [scopeBullets, setScopeBullets] = useState<ScopeUnderstandingBullet[]>([]);
  const sessionState = useMemo<GuidedIntakeSessionState>(
    () => ({
      freeTextIntent,
      businessOutcome,
      systemName,
      actorSet,
      answers,
      draftId,
    }),
    [actorSet, answers, businessOutcome, draftId, freeTextIntent, systemName],
  );
  const handleSessionRestore = useCallback((snapshot: { stepIndex: number; state: GuidedIntakeSessionState }) => {
    setStep(snapshot.stepIndex);
    setFreeTextIntent(snapshot.state.freeTextIntent);
    setBusinessOutcome(snapshot.state.businessOutcome);
    setSystemName(snapshot.state.systemName);
    setActorSet(snapshot.state.actorSet);
    setAnswers(snapshot.state.answers);
    setDraftId(snapshot.state.draftId);
  }, []);
  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewGuidedQuestions,
    stepIndex: step,
    state: sessionState,
    hasSaveableContent: (state, currentStep) =>
      currentStep > 0 ||
      wizardSessionHasTextContent(state.freeTextIntent) ||
      wizardSessionHasTextContent(state.businessOutcome) ||
      wizardSessionHasTextContent(state.systemName) ||
      state.draftId !== null,
    onRestore: handleSessionRestore,
  });

  const totalRequiredClarifications = Math.max(requiredMustQuestionKeys.length, pendingQuestions.length);
  const activePendingQuestions = useMemo(
    () => pendingQuestions.filter((question) => !savedLocallyQuestionKeys.has(question.questionKey)),
    [pendingQuestions, savedLocallyQuestionKeys],
  );
  const resolvedClarificationCount = Math.max(0, totalRequiredClarifications - activePendingQuestions.length);
  const primaryPendingQuestion = activePendingQuestions[0] ?? null;
  const otherPendingQuestions =
    viewAllClarifications && activePendingQuestions.length > 1 ? activePendingQuestions.slice(1) : [];

  const intentTrimmedLength = freeTextIntent.trim().length;
  const intentMeetsMinimum = intentTrimmedLength >= MIN_INTENT_CHARS;
  const outcomeTrimmedLength = businessOutcome.trim().length;
  const outcomeMeetsMinimum = outcomeTrimmedLength >= MIN_OUTCOME_CHARS;
  const systemNameMeetsMinimum = systemName.trim().length > 0;

  const intentFieldLabel = isCreateArchitectureFlow
    ? GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL
    : GUIDED_INTAKE_ARCHITECTURE_INTENT_LABEL;

  const advanceBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (isCreateArchitectureFlow && !systemNameMeetsMinimum) {
      blockers.push("system name");
    }

    if (!intentMeetsMinimum) {
      blockers.push(intentFieldLabel.toLowerCase());
    }

    if (!outcomeMeetsMinimum) {
      blockers.push("business outcome");
    }

    if (!isCreateArchitectureFlow && actorSet.actors.length === 0) {
      blockers.push("at least one person or system");
    }

    // Confirmed scope is merged into the brief by the patch that precedes admission, so it has to be
    // settled before the wizard leaves this step — the draft is immutable once it is admitted.
    if (!scopeGateOpen) {
      blockers.push(GUIDED_INTAKE_SCOPE_CONFIRMATION_BLOCKER);
    }

    return blockers;
  }, [
    actorSet.actors.length,
    intentFieldLabel,
    intentMeetsMinimum,
    isCreateArchitectureFlow,
    outcomeMeetsMinimum,
    scopeGateOpen,
    systemNameMeetsMinimum,
  ]);

  const canAdvanceIntent = advanceBlockers.length === 0 && !busy;

  const advanceHint = buildGuidedIntakeCreationAdvanceBlockerMessage(advanceBlockers);

  const allClarificationsHandled =
    pendingQuestions.length === 0 ||
    pendingQuestions.every((question) => savedLocallyQuestionKeys.has(question.questionKey));
  const canReviewAnswers = allClarificationsHandled && !busy;
  // Scope is gated on step 0 and already persisted on the draft, so it is not re-gated here.
  const canSubmit = draftId !== null && allClarificationsHandled && !busy && !blocksLlmExecution;
  const confirmedScopeLines = useMemo(() => scopeBriefLines(scopeBullets), [scopeBullets]);

  const scopeUnderstandingInput = useMemo(
    () => ({
      architectureName: systemName,
      businessOutcome,
      architectureOverview: freeTextIntent,
      intentText: freeTextIntent,
      peopleAndSystems: actorSet.actors.map((actor) => ({
        label: actor.label?.trim() || actor.kind,
        kind: actor.kind,
      })),
    }),
    [actorSet.actors, businessOutcome, freeTextIntent, systemName],
  );
  const guidedIntakeEvidencePresence = useMemo(
    () =>
      deriveEvidencePresenceFromFileNames(
        freeTextIntent.trim().length > 0 || businessOutcome.trim().length > 0 ? ["architecture-brief.md"] : [],
      ),
    [businessOutcome, freeTextIntent],
  );

  const stepLabel = useMemo(() => `Step ${step + 1} of ${INTAKE_STEPS.length}`, [step]);

  // Prefer system name / intent for the saved-architecture banner; keep the GUID in the draft href only.
  const sourceArchitectureDisplayName = useMemo(
    () => architectureDraftDisplayName(systemName, freeTextIntent),
    [freeTextIntent, systemName],
  );

  useEffect(() => {
    if (exampleTemplate === null || exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    exampleTemplatePrefillAppliedRef.current = true;
    setFreeTextIntent(exampleTemplate.briefText);
    setBusinessOutcome(exampleTemplate.businessOutcome);
    setSystemName(exampleTemplate.systemName);
  }, [exampleTemplate]);

  useEffect(() => {
    if (!isCreateArchitectureFlow || creationInitStartedRef.current) {
      return;
    }

    creationInitStartedRef.current = true;

    void initializeArchitectureCreation().then(async (result) => {
      if (result.draftId !== null) {
        setDraftId(result.draftId);
        await patchDraftRequest(result.draftId, { workflowIntent: CREATE_ARCHITECTURE_INTENT });
      }

      const formState = applyArchitectureCreationDraftToFormState(result.draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      setAllQuestions([...result.questionSelection.allQuestions]);
      setRequiredMustQuestionKeys([...result.questionSelection.requiredMustQuestionKeys]);
      setPendingQuestions([...result.questionSelection.pendingMustQuestions]);
    });
  }, [isCreateArchitectureFlow]);

  useEffect(() => {
    if (sourceArchitectureId.length === 0 || isCreateArchitectureFlow || sourceArchitectureLoadedRef.current) {
      return;
    }

    sourceArchitectureLoadedRef.current = true;

    void getDraftRequest(sourceArchitectureId).then((draft) => {
      setDraftId(draft.draftId);
      const formState = applyArchitectureCreationDraftToFormState(draft);
      setFreeTextIntent(formState.freeTextIntent);
      setBusinessOutcome(formState.businessOutcome);
      setSystemName(formState.systemName);
      setActorSet(
        draft.document.actorSet.actors.length > 0
          ? draft.document.actorSet
          : architectureCreationDefaultActorSet(),
      );
    });
  }, [isCreateArchitectureFlow, sourceArchitectureId]);

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
      await refreshQuestions(branch.draftId);
      showSuccess("What-if branch created — you are now editing the branch draft.");
    },
    [refreshQuestions],
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
        );
        id = created.draftId;
        setDraftId(id);
        writeArchitectureCreationDraftId(id);
      }

      await patchDraftRequest(id, {
        freeTextIntent: mergeScopeBulletsIntoBrief(scopeBullets, freeTextIntent),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: CREATE_ARCHITECTURE_INTENT,
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
  }, [actorSet, businessOutcome, draftId, focusedPilotModeEnabled, freeTextIntent, isCreateArchitectureFlow, scopeBullets, systemName]);

  const runAdmission = useCallback(async () => {
    setBusy(true);
    setSubmitError(null);
    setRedirectReason(null);
    setRedirectVerdict(null);

    try {
      const created = await createDraftRequest(
        freeTextIntent.trim(),
        isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
      );
      const id = created.draftId;
      setDraftId(id);

      // Confirmed scope goes onto the server copy of the brief before admission: a draft is immutable
      // once admitted, and the admission gate must see the same text the reviewer will read.
      await patchDraftRequest(id, {
        freeTextIntent: mergeScopeBulletsIntoBrief(scopeBullets, freeTextIntent),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: normalizeActorSetForAdmission(actorSet),
        focusedPilotModeEnabled,
        workflowIntent: isCreateArchitectureFlow ? CREATE_ARCHITECTURE_INTENT : START_REVIEW_INTENT,
      });

      const admission = await admitDraftRequest(id);

      if (!admission.admitted) {
        setRedirectReason(admission.redirectReason ?? admission.verdict.summary);
        setRedirectVerdict(admission.verdict);
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, admission.redirectReason ?? "Readiness checks redirected this draft.");
        return;
      }

      setPendingQuestions(admission.pendingMustQuestions);
      setRequiredMustQuestionKeys(admission.requiredMustQuestionKeys);
      setSavedLocallyQuestionKeys(new Set());
      await refreshQuestions(id);
      setViewAllClarifications(false);
      setStep(1);
      showSuccess(GUIDED_INTAKE_READINESS_SUCCESS_TOAST);
    } catch (error) {
      setSubmitError(error);
      if (isApiRequestError(error)) {
        showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [actorSet, businessOutcome, focusedPilotModeEnabled, freeTextIntent, isCreateArchitectureFlow, refreshQuestions, scopeBullets, systemName]);

  const reviewAnswers = useCallback(async () => {
    if (draftId === null) {
      return;
    }

    const unresolvedQuestions = pendingQuestions.filter(
      (question) => !savedLocallyQuestionKeys.has(question.questionKey),
    );

    if (unresolvedQuestions.length > 0) {
      showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, "Answer or skip each required clarification before reviewing.");
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
  }, [answers, draftId, pendingQuestions, refreshQuestions, savedLocallyQuestionKeys]);

  const saveAndContinue = useCallback((questionKey: string) => {
    const answer = answers[questionKey]?.trim() ?? "";

    if (answer.length === 0) {
      showError(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, "Enter an answer or skip this clarification.");
      return;
    }

    setSavedLocallyQuestionKeys((current) => {
      const next = new Set(current);
      next.add(questionKey);
      return next;
    });
  }, [answers]);

  const skipQuestion = useCallback(
    async (questionKey: string) => {
      if (draftId === null) {
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
      recordFirstTenantFunnelEvent("first_run_started");
      wizardSession.clearSession();

      const compareParentRunId = result.parentSpawnedRunId ?? parentSpawnedRunId;

      if (compareParentRunId !== null && compareParentRunId.trim().length > 0) {
        showSuccess("What-if branch review started — open Compare when both reviews are ready.");
        router.push(runDetailHrefWithParentRun(result.runId, compareParentRunId));
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

      router.push(
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
  }, [actorSet.actors, businessOutcome, draftId, freeTextIntent, isCreateArchitectureFlow, parentSpawnedRunId, router, systemName, wizardSession]);

  return (
    <div
      className={cn("space-y-4", isCreateArchitectureFlow && "max-w-3xl")}
      data-testid="socratic-intake-wizard"
    >
      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}
      <div className="flex justify-end">
        <WizardSessionSaveStatus
          saveState={wizardSession.saveState}
          lastSavedUtc={wizardSession.lastSavedUtc}
        />
      </div>
      {!isCreateArchitectureFlow ? (
        <div
          className={WIZARD_STICKY_PROGRESS_CLASS}
          data-testid={WIZARD_STICKY_PROGRESS_TEST_ID}
        >
          <p
            className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 text-neutral-600 dark:text-neutral-400")}
            data-testid="socratic-intake-progress"
          >
            {stepLabel} — {INTAKE_STEPS[step]?.progressLabel}
          </p>
        </div>
      ) : null}
      {!isCreateArchitectureFlow ? (
        <DraftIntakeClaimLabel surface="structural-admission" />
      ) : null}

      {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}

      {sourceArchitectureId.length > 0 ? (
        <p
          className={cn(
            "m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="socratic-source-architecture-banner"
        >
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD}
          </span>{" "}
          This review evaluates a snapshot of{" "}
          <Link
            href={architectureDraftPath(sourceArchitectureId)}
            className="font-medium underline"
            title={`Architecture id ${sourceArchitectureId}`}
          >
            {sourceArchitectureDisplayName}
          </Link>
          . {GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL}
        </p>
      ) : null}

      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}

      {parentDraftId !== null ? (
        <p
          className={cn(
            "m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="socratic-what-if-branch-hint"
        >
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD}
          </span>{" "}
          Editing branch draft {draftId} forked from parent {parentDraftId}. Submit as a separate review, then Compare.
          {parentSpawnedRunId !== null ? (
            <>
              {" "}
              Parent review{" "}
              <Link
                href={comparePageHrefAdaptive(parentSpawnedRunId)}
                className="font-medium underline"
              >
                {parentSpawnedRunId}
              </Link>{" "}
              is already spawned — after submit you can compare outcomes immediately.
            </>
          ) : null}
        </p>
      ) : null}

      {redirectReason !== null && redirectVerdict !== null && draftId !== null ? (
        <DraftIntakeDecisionReceiptCard
          draftId={draftId}
          redirectReason={redirectReason}
          verdict={redirectVerdict}
          freeTextIntent={freeTextIntent}
          businessOutcome={businessOutcome}
          systemName={systemName}
        />
      ) : null}

      {step === 0 ? (
        <Card data-testid="guided-intake-primary-panel">
          {!isCreateArchitectureFlow ? (
            <CardHeader>
              <CardTitle>{INTAKE_STEPS[0].cardTitle}</CardTitle>
              <CardDescription>{INTAKE_STEPS[0].description}</CardDescription>
            </CardHeader>
          ) : null}
          <CardContent className={cn(isCreateArchitectureFlow ? "space-y-6" : "space-y-4", isCreateArchitectureFlow && "pt-4")}>
            {isCreateArchitectureFlow ? (
              <div className="space-y-2">
                <IntakeFieldLabel
                  htmlFor="socratic-system-name"
                  label={GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL}
                  required
                />
                <Input
                  id="socratic-system-name"
                  value={systemName}
                  onChange={(event) => setSystemName(event.target.value)}
                  disabled={busy}
                  placeholder={GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER}
                  data-testid="socratic-system-name"
                  aria-required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <IntakeFieldLabel htmlFor="socratic-intent" label={intentFieldLabel} required />
              <Textarea
                id="socratic-intent"
                value={freeTextIntent}
                onChange={(event) => setFreeTextIntent(event.target.value)}
                rows={isCreateArchitectureFlow ? 4 : 3}
                disabled={busy}
                placeholder={
                  isCreateArchitectureFlow
                    ? GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER
                    : GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER
                }
                data-testid="socratic-intent"
                aria-invalid={intentTrimmedLength > 0 && !intentMeetsMinimum}
                aria-describedby="socratic-intent-helper"
                aria-required
              />
              <p
                id="socratic-intent-helper"
                className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
                role={intentTrimmedLength > 0 && !intentMeetsMinimum ? "alert" : "status"}
                data-testid="socratic-intent-helper"
              >
                {isCreateArchitectureFlow
                  ? guidedIntakeCreationArchitectureOverviewHelperText(intentTrimmedLength)
                  : guidedIntakeArchitectureIntentHelperText(intentTrimmedLength)}
              </p>
            </div>

            {isCreateArchitectureFlow ? (
              <div className="space-y-2">
                <IntakeFieldLabel
                  htmlFor="socratic-outcome"
                  label={GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}
                  required
                />
                <Textarea
                  id="socratic-outcome"
                  value={businessOutcome}
                  onChange={(event) => setBusinessOutcome(event.target.value)}
                  rows={2}
                  disabled={busy}
                  placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
                  data-testid="socratic-outcome"
                  aria-invalid={outcomeTrimmedLength > 0 && !outcomeMeetsMinimum}
                  aria-describedby="socratic-outcome-helper"
                  aria-required
                />
                <p
                  id="socratic-outcome-helper"
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
                  role={outcomeTrimmedLength > 0 && !outcomeMeetsMinimum ? "alert" : "status"}
                  data-testid="socratic-outcome-helper"
                >
                  {outcomeTrimmedLength === 0
                    ? GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER
                    : outcomeMeetsMinimum
                      ? `${outcomeTrimmedLength} characters.`
                      : `${outcomeTrimmedLength} / ${MIN_OUTCOME_CHARS} characters. ${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER}`}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <IntakeFieldLabel htmlFor="socratic-system-name" label="System name" required={false} />
                  <Input
                    id="socratic-system-name"
                    value={systemName}
                    onChange={(event) => setSystemName(event.target.value)}
                    disabled={busy}
                    data-testid="socratic-system-name"
                  />
                </div>
                <div className="space-y-2">
                  <IntakeFieldLabel htmlFor="socratic-outcome" label="Business outcome" required />
                  <Textarea
                    id="socratic-outcome"
                    value={businessOutcome}
                    onChange={(event) => setBusinessOutcome(event.target.value)}
                    rows={2}
                    disabled={busy}
                    placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
                    data-testid="socratic-outcome"
                    aria-required
                  />
                </div>
              </>
            )}

            <DraftIntakeActorEditor
              actorSet={actorSet}
              intentText={freeTextIntent}
              disabled={busy}
              creationFlow={isCreateArchitectureFlow}
              onChange={setActorSet}
            />

            <PilotModePolicyPackToggle
              enabled={focusedPilotModeEnabled}
              onEnabledChange={setFocusedPilotModeEnabled}
              presentation={isCreateArchitectureFlow ? "scope-card" : "checkbox"}
              className={isCreateArchitectureFlow ? "max-w-md" : undefined}
            />

            <ArchitectureScopeUnderstandingCheckPanel
              input={scopeUnderstandingInput}
              contextSourceLabel={`${intentFieldLabel} above`}
              readyHint={SCOPE_UNDERSTANDING_READY_TO_CONTINUE_HINT}
              // Local editing only — an exhausted LLM budget must not lock the operator out of step 0.
              disabled={busy}
              onBulletsChange={setScopeBullets}
              onGateChange={setScopeGateOpen}
            />

            {!canAdvanceIntent && advanceHint.length > 0 ? (
              <p
                className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
                role="status"
                data-testid="socratic-advance-hint"
              >
                {advanceHint}
              </p>
            ) : null}

            {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}

            <Button
              type="button"
              disabled={!canAdvanceIntent}
              onClick={() => {
                if (isCreateArchitectureFlow) {
                  void runCreateArchitectureContinuation();
                  return;
                }

                void runAdmission();
              }}
              data-testid="socratic-admit"
            >
              {busy
                ? isCreateArchitectureFlow
                  ? CREATE_ARCHITECTURE_STARTING_LABEL
                  : "Checking readiness…"
                : isCreateArchitectureFlow
                  ? GUIDED_INTAKE_CONTINUE_TO_DISCOVERY
                  : GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card data-testid="guided-intake-primary-panel">
          <CardHeader>
            <CardTitle>{INTAKE_STEPS[1].cardTitle}</CardTitle>
            <CardDescription>
              {isCreateArchitectureFlow
                ? GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION
                : activePendingQuestions.length === 0
                  ? "All required clarifications are answered or skipped. You can continue."
                  : `${activePendingQuestions.length} required clarification${activePendingQuestions.length === 1 ? "" : "s"} remaining before review.`}{" "}
              {isCreateArchitectureFlow
                ? "Your answers stay with the architecture draft until you choose to start a review."
                : "Your answers will be included when you review and submit."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {primaryPendingQuestion !== null ? (
              <DraftIntakeRequiredClarificationField
                key={primaryPendingQuestion.questionKey}
                question={primaryPendingQuestion}
                answer={answers[primaryPendingQuestion.questionKey] ?? ""}
                busy={busy}
                clarificationIndex={resolvedClarificationCount + 1}
                clarificationTotal={totalRequiredClarifications}
                isPrimary
                compactActions={viewAllClarifications}
                canSaveAndContinue={(answers[primaryPendingQuestion.questionKey]?.trim() ?? "").length > 0}
                onAnswerChange={(questionKey, value) => {
                  setAnswers((current) => ({
                    ...current,
                    [questionKey]: value,
                  }));
                }}
                onSaveAndContinue={(questionKey) => {
                  saveAndContinue(questionKey);
                }}
                onSkip={(questionKey) => {
                  void skipQuestion(questionKey);
                }}
              />
            ) : null}

            {pendingQuestions.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                data-testid="socratic-view-all-clarifications"
                onClick={() => {
                  setViewAllClarifications((current) => !current);
                }}
              >
                {viewAllClarifications
                  ? "Show one at a time"
                  : `Show all ${totalRequiredClarifications} clarifications`}
              </Button>
            ) : null}

            {otherPendingQuestions.length > 0 ? (
              <div className="space-y-3" data-testid="socratic-other-clarifications">
                <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.tab)}>
                  Other clarifications
                </p>
                {otherPendingQuestions.map((question, index) => (
                  <DraftIntakeRequiredClarificationField
                    key={question.questionKey}
                    question={question}
                    answer={answers[question.questionKey] ?? ""}
                    busy={busy}
                    clarificationIndex={resolvedClarificationCount + index + 2}
                    clarificationTotal={totalRequiredClarifications}
                    isPrimary={false}
                    compactActions
                    canSaveAndContinue={(answers[question.questionKey]?.trim() ?? "").length > 0}
                    onAnswerChange={(questionKey, value) => {
                      setAnswers((current) => ({
                        ...current,
                        [questionKey]: value,
                      }));
                    }}
                    onSaveAndContinue={(questionKey) => {
                      saveAndContinue(questionKey);
                    }}
                    onSkip={(questionKey) => {
                      void skipQuestion(questionKey);
                    }}
                  />
                ))}
              </div>
            ) : null}

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="socratic-clarification-helper">
              Answer or skip each clarification. You can review everything before starting the architecture review.
            </p>

            <div className="space-y-2">
              {!allClarificationsHandled ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="socratic-review-answers-hint">
                  Handle all required clarifications first.
                </p>
              ) : null}
              {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}
              <Button
                type="button"
                variant={allClarificationsHandled ? "primary" : "outline"}
                disabled={!canReviewAnswers}
                onClick={() => {
                  if (pendingQuestions.length === 0) {
                    setStep(2);
                    return;
                  }

                  void reviewAnswers();
                }}
                data-testid="socratic-questions-done"
              >
                {busy ? "Saving answers…" : "Review answers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {draftId !== null && step === 1 ? (
        <SocraticIntakeWizardAdvancedRail
          draftId={draftId}
          busy={busy}
          blocksLlmExecution={blocksLlmExecution}
          freeTextIntent={freeTextIntent}
          businessOutcome={businessOutcome}
          systemName={systemName}
          allQuestions={allQuestions}
          pendingQuestions={pendingQuestions}
          onBranched={(response) => {
            void applyBranchDraft(response);
          }}
        />
      ) : null}

      {step === 2 ? (
        <Card data-testid="guided-intake-primary-panel">
          <CardHeader>
            <CardTitle>{INTAKE_STEPS[2].cardTitle}</CardTitle>
            <CardDescription>{GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className={cn("list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                <InlineMetadataLabel label="Intent" />{" "}
                {freeTextIntent.trim().slice(0, 120)}
                {freeTextIntent.trim().length > 120 ? "…" : ""}
              </li>
              <li>
                <InlineMetadataLabel label="Outcome" /> {businessOutcome.trim()}
              </li>
              {systemName.trim() ? (
                <li>
                  <InlineMetadataLabel label="System" /> {systemName.trim()}
                </li>
              ) : null}
            </ul>
            <EvidenceGapForecastPanel presence={guidedIntakeEvidencePresence} />
            {confirmedScopeLines.length > 0 ? (
              <section className="space-y-1" data-testid="socratic-confirmed-scope-summary">
                <h3 className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.label)}>
                  {GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING}
                </h3>
                <ul
                  className={cn(
                    "m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                >
                  {confirmedScopeLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(1)}>
                Back to questions
              </Button>
              <ReviewStartLoadingButton
                type="button"
                disabled={!canSubmit}
                isLoading={busy}
                idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
                loadingLabel={REVIEW_START_LOADING_LABEL}
                onClick={() => {
                  void submitDraft();
                }}
                data-testid="socratic-submit"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
