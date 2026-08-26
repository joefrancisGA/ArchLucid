"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { DraftIntakeRequiredClarificationField, REQUIRED_CLARIFICATION_BASELINE_LABEL } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WIZARD_STICKY_FOOTER_CLASS,
  WIZARD_STICKY_FOOTER_SCROLL_CLEARANCE_CLASS,
  WIZARD_STICKY_FOOTER_TEST_ID,
} from "@/lib/wizard-sticky-progress";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION,
  GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL,
  GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD,
  guidedIntakeClarificationsAnsweredCounter,
  GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD,
} from "@/lib/guided-intake-copy";
import {
  DraftIntakeDecisionReceiptCard,
  SocraticIntakeWizardAdvancedRail,
} from "./SocraticIntakeWizardDeferredPanels";
import { SocraticIntakeWizardStepConfirm } from "./SocraticIntakeWizardStepConfirm";
import { SocraticIntakeWizardStepScope } from "./SocraticIntakeWizardStepScope";
import { ReviewsNewBuyerChrome } from "./ReviewsNewBuyerChrome";
import { GuidedIntakeRequestError } from "./GuidedIntakeRequestError";
import { GuidedIntakeAlreadySubmittedCallout } from "./GuidedIntakeAlreadySubmittedCallout";
import { INTAKE_STEPS, INTAKE_WIZARD_STEPPER_STEPS } from "./guided-intake-steps";
import { useGuidedIntakeWizard } from "./use-guided-intake-wizard";

/** Guided intake: write the brief, answer required clarifications, submit the review package. */
export function SocraticIntakeWizard() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  } = useGuidedIntakeWizard();

  const completedWizardSteps = useMemo(
    () => Array.from({ length: step }, (_, index) => index),
    [step],
  );

  function renderClarificationField(
    question: (typeof pendingQuestions)[number],
    options: {
      readonly isPrimary: boolean;
      readonly isFocused: boolean;
    },
  ): React.JSX.Element {
    const questionKey = question.questionKey;

    return (
      <DraftIntakeRequiredClarificationField
        key={questionKey}
        question={question}
        answer={answers[questionKey] ?? ""}
        busy={busy}
        clarificationIndex={getClarificationOrdinal(questionKey)}
        clarificationTotal={totalRequiredClarifications}
        isPrimary={options.isPrimary}
        isFocused={options.isFocused}
        compactActions={viewAllClarifications}
        showAllMode={viewAllClarifications}
        showBaselineLabel={false}
        showRequirednessSuffix={false}
        clarificationStatus={getClarificationStatus(questionKey)}
        canSaveAndContinue={(answers[questionKey]?.trim() ?? "").length > 0}
        onAnswerChange={(nextQuestionKey, value) => {
          setAnswers((current) => ({
            ...current,
            [nextQuestionKey]: value,
          }));
        }}
        onSaveAndContinue={(nextQuestionKey) => {
          saveAndContinue(nextQuestionKey);
        }}
        onSkip={(nextQuestionKey) => {
          void skipQuestion(nextQuestionKey);
        }}
      />
    );
  }

  if (sourceArchitectureAccessBlocked) {
    return (
      <div
        className={cn(OPERATOR_LAYOUT.mainWithStickyAside)}
        data-testid="socratic-intake-wizard"
      >
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
    <div
      className={cn(OPERATOR_LAYOUT.mainWithStickyAside)}
      data-testid="socratic-intake-wizard"
    >
      <div className="min-w-0 space-y-4">
      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}
      <div className="flex justify-end">
        <WizardSessionSaveStatus saveState={wizardSession.saveState} />
      </div>
      <WizardStepper
        steps={[...INTAKE_WIZARD_STEPPER_STEPS]}
        currentStep={step}
        completedSteps={completedWizardSteps}
      />
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
          onCreateArchitectureContinuation={runCreateArchitectureContinuation}
          onAdmission={runAdmission}
        />
      ) : null}

      {step === 1 ? (
        <div data-testid="socratic-clarifications-step">
          <Card
            className={WIZARD_STICKY_FOOTER_SCROLL_CLEARANCE_CLASS}
            data-testid="guided-intake-primary-panel"
          >
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
            <p
              className={cn("m-0 pt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="socratic-clarifications-baseline-label"
            >
              {REQUIRED_CLARIFICATION_BASELINE_LABEL}
            </p>
          </CardHeader>
          <CardContent className={OPERATOR_LAYOUT.sectionStack}>
            {primaryPendingQuestion !== null
              ? renderClarificationField(primaryPendingQuestion, {
                  isPrimary: true,
                  isFocused: !viewAllClarifications,
                })
              : null}

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
                  Other required clarifications
                </p>
                {otherPendingQuestions.map((question) =>
                  renderClarificationField(question, {
                    isPrimary: false,
                    isFocused: false,
                  }),
                )}
              </div>
            ) : null}

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="socratic-clarification-helper">
              Answer or skip each clarification. You can review everything before starting the architecture review.
            </p>

            {submitError !== null ? <GuidedIntakeRequestError error={submitError} /> : null}
          </CardContent>
        </Card>

        <div
          className={WIZARD_STICKY_FOOTER_CLASS}
          data-testid={WIZARD_STICKY_FOOTER_TEST_ID}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p
                className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
                data-testid="socratic-clarifications-answered-counter"
              >
                {guidedIntakeClarificationsAnsweredCounter(
                  handledClarificationCount,
                  totalRequiredClarifications,
                )}
              </p>
              {!allClarificationsHandled ? (
                <p
                  className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="socratic-review-answers-hint"
                >
                  {GUIDED_INTAKE_REVIEW_ANSWERS_DISABLED_HINT}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={!canReviewAnswers}
              onClick={() => {
                if (isSubmitBlocked) {
                  return;
                }

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
        </div>
        </div>
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

      {buyerPolishedShell ? <ReviewsNewBuyerChrome /> : null}
      </div>

      <aside
        className={cn(OPERATOR_LAYOUT.stickyAsideTop, "hidden min-w-0 lg:block")}
        data-testid="socratic-intake-context-rail"
        data-operator-side-rail-kind="working-object"
      >
        {draftId !== null && step >= 1 ? (
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
        ) : null}
      </aside>
    </div>
  );
}
