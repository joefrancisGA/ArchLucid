"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useReviewsNewSuppressWizardResumePrompt } from "@/hooks/use-reviews-new-suppress-wizard-resume-prompt";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL,
  GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD,
} from "@/lib/guided-intake-copy";
import {
  DraftIntakeDecisionReceiptCard,
  SocraticIntakeWizardAdvancedRail,
} from "./SocraticIntakeWizardDeferredPanels";
import { SocraticIntakeWizardStepClarifications } from "./SocraticIntakeWizardStepClarifications";
import { SocraticIntakeWizardStepConfirm } from "./SocraticIntakeWizardStepConfirm";
import { SocraticIntakeWizardStepScope } from "./SocraticIntakeWizardStepScope";
import { ReviewsNewBuyerChrome } from "./ReviewsNewBuyerChrome";
import { GuidedIntakeAlreadySubmittedCallout } from "./GuidedIntakeAlreadySubmittedCallout";
import { INTAKE_WIZARD_STEPPER_STEPS } from "./guided-intake-steps";
import { useGuidedIntakeWizard } from "./use-guided-intake-wizard";

/** Guided intake: write the brief, answer required clarifications, submit the review package. */
export function SocraticIntakeWizard() {
  const evalChrome = useProductionEvalChrome();
  const suppressWizardResumePrompt = useReviewsNewSuppressWizardResumePrompt();
  const { isSimulator } = useAgentExecutionMode();
  const {
    // Intake context (query string, budget gate)
    exampleTemplate,
    isCreateArchitectureFlow,
    sourceArchitectureId,
    sourceArchitectureDisplayName,
    llmBudgetStatus,
    blocksLlmExecution,
    step,
    setStep,
    wizardSession,
    // Brief form
    freeTextIntent,
    setFreeTextIntent,
    businessOutcome,
    setBusinessOutcome,
    systemName,
    setSystemName,
    actorSet,
    setActorSet,
    focusedPilotModeEnabled,
    setFocusedPilotModeEnabled,
    setScopeBullets,
    setScopeGateOpen,
    intentTrimmedLength,
    intentMeetsMinimum,
    outcomeTrimmedLength,
    outcomeMeetsMinimum,
    intentFieldLabel,
    advanceHint,
    confirmedScopeLines,
    scopeUnderstandingInput,
    guidedIntakeEvidencePresence,
    priorAttachedFileNames,
    setEvidenceFiles,
    // Draft workflow
    busy,
    submitError,
    draftId,
    draftStatus,
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
    isSubmitBlocked,
    linkedSpawnedRunId,
    sourceArchitectureAccessBlocked,
    // Gates
    canAdvanceIntent,
    canReviewAnswers,
    canSubmit,
    policyPackCloudMismatch,
    clarificationInference,
    systemNameAvailability,
  } = useGuidedIntakeWizard();

  const {
    inferredQuestionKeys,
    rephrasedQuestionKeys,
    isExtractingEvidenceText,
    clarificationSuggestionsUnavailable,
    canSuggestFromEvidence,
    suggestAnswersFromEvidence,
    markQuestionEdited,
  } = clarificationInference;
  const suggestedDraftCount = inferredQuestionKeys.size;

  useEffect(() => {
    if (suggestedDraftCount > 0) {
      setViewAllClarifications(true);
    }
  }, [setViewAllClarifications, suggestedDraftCount]);

  const completedWizardSteps = useMemo(
    () => Array.from({ length: step }, (_, index) => index),
    [step],
  );

  if (sourceArchitectureAccessBlocked) {
    return (
      <div className="w-full" data-testid="socratic-intake-wizard">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="guided-intake-access-blocked-redirect"
          role="status"
        >
          <ReviewStartInlineSpinner />
          <span>{GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="socratic-intake-wizard">
      {/* Flex gap, not space-y: child `m-0` beats Tailwind v4 space-y (`:where()`, 0 specificity). */}
      <div className="flex min-w-0 flex-col gap-4">
      {wizardSession.pendingRestore !== null && !suppressWizardResumePrompt ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}
      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        data-testid="socratic-intake-stepper-row"
      >
        <WizardStepper
          steps={[...INTAKE_WIZARD_STEPPER_STEPS]}
          currentStep={step}
          completedSteps={completedWizardSteps}
          className="min-w-0 flex-1"
        />
        <WizardSessionSaveStatus saveState={wizardSession.saveState} />
      </div>
      {draftId !== null && step >= 1 ? (
        <div data-testid="socratic-intake-advanced-options">
          <SocraticIntakeWizardAdvancedRail
            draftId={draftId}
            draftStatus={draftStatus}
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
        </div>
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
          This review evaluates{" "}
          <Link
            href={architectureIdentityPath(sourceArchitectureId)}
            className="font-medium underline"
            title={`Architecture id ${sourceArchitectureId}`}
          >
            {sourceArchitectureDisplayName}
          </Link>
          . {GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL}
        </p>
      ) : null}

      {isSubmitBlocked ? (
        <GuidedIntakeAlreadySubmittedCallout linkedSpawnedRunId={linkedSpawnedRunId} />
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
        <SocraticIntakeWizardStepScope
          isCreateArchitectureFlow={isCreateArchitectureFlow}
          busy={busy}
          systemName={systemName}
          setSystemName={setSystemName}
          freeTextIntent={freeTextIntent}
          setFreeTextIntent={setFreeTextIntent}
          businessOutcome={businessOutcome}
          setBusinessOutcome={setBusinessOutcome}
          actorSet={actorSet}
          setActorSet={setActorSet}
          focusedPilotModeEnabled={focusedPilotModeEnabled}
          setFocusedPilotModeEnabled={setFocusedPilotModeEnabled}
          intentFieldLabel={intentFieldLabel}
          intentTrimmedLength={intentTrimmedLength}
          intentMeetsMinimum={intentMeetsMinimum}
          outcomeTrimmedLength={outcomeTrimmedLength}
          outcomeMeetsMinimum={outcomeMeetsMinimum}
          scopeUnderstandingInput={scopeUnderstandingInput}
          setScopeBullets={setScopeBullets}
          setScopeGateOpen={setScopeGateOpen}
          canAdvanceIntent={canAdvanceIntent}
          advanceHint={advanceHint}
          submitError={submitError}
          systemNameAvailability={systemNameAvailability}
          priorAttachedFileNames={priorAttachedFileNames}
          onEvidenceFilesChange={setEvidenceFiles}
          onCreateArchitectureContinuation={runCreateArchitectureContinuation}
          onAdmission={runAdmission}
        />
      ) : null}

      {step === 1 ? (
        <SocraticIntakeWizardStepClarifications
          isCreateArchitectureFlow={isCreateArchitectureFlow}
          activePendingQuestions={activePendingQuestions}
          primaryPendingQuestion={primaryPendingQuestion}
          otherPendingQuestions={otherPendingQuestions}
          pendingQuestions={pendingQuestions}
          answers={answers}
          setAnswers={setAnswers}
          viewAllClarifications={viewAllClarifications}
          setViewAllClarifications={setViewAllClarifications}
          totalRequiredClarifications={totalRequiredClarifications}
          handledClarificationCount={handledClarificationCount}
          allClarificationsHandled={allClarificationsHandled}
          getClarificationOrdinal={getClarificationOrdinal}
          getClarificationStatus={getClarificationStatus}
          inferredQuestionKeys={inferredQuestionKeys}
          rephrasedQuestionKeys={rephrasedQuestionKeys}
          isExtractingEvidenceText={isExtractingEvidenceText}
          canSuggestFromEvidence={canSuggestFromEvidence}
          isSimulator={isSimulator}
          clarificationSuggestionsUnavailable={clarificationSuggestionsUnavailable}
          busy={busy}
          submitError={submitError}
          canReviewAnswers={canReviewAnswers}
          isSubmitBlocked={isSubmitBlocked}
          suggestAnswersFromEvidence={suggestAnswersFromEvidence}
          markQuestionEdited={markQuestionEdited}
          saveAndContinue={saveAndContinue}
          skipQuestion={skipQuestion}
          reviewAnswers={reviewAnswers}
          onAdvanceToConfirm={() => setStep(2)}
        />
      ) : null}

      {step === 2 && !isSubmitBlocked ? (
        <SocraticIntakeWizardStepConfirm
          freeTextIntent={freeTextIntent}
          businessOutcome={businessOutcome}
          systemName={systemName}
          guidedIntakeEvidencePresence={guidedIntakeEvidencePresence}
          confirmedScopeLines={confirmedScopeLines}
          submitError={submitError}
          policyPackCloudMismatch={policyPackCloudMismatch}
          busy={busy}
          canSubmit={canSubmit}
          onBack={() => setStep(1)}
          onSubmit={submitDraft}
        />
      ) : null}

      {evalChrome ? <ReviewsNewBuyerChrome /> : null}
      </div>
    </div>
  );
}
