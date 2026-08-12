"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { CREATE_ARCHITECTURE_STARTING_LABEL, REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import { SCOPE_UNDERSTANDING_READY_TO_CONTINUE_HINT } from "@/lib/architecture/architecture-scope-understanding-check";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WIZARD_STICKY_PROGRESS_CLASS,
  WIZARD_STICKY_PROGRESS_TEST_ID,
} from "@/lib/wizard-sticky-progress";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
  GUIDED_INTAKE_CONFIRMED_SCOPE_SUMMARY_HEADING,
  GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS,
  GUIDED_INTAKE_CONTINUE_TO_DISCOVERY,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_PLACEHOLDER,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD,
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_TAIL,
  GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
  GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD,
  guidedIntakeArchitectureIntentHelperText,
  guidedIntakeCreationArchitectureOverviewHelperText,
} from "@/lib/guided-intake-copy";

import {
  DraftIntakeDecisionReceiptCard,
  SocraticIntakeWizardAdvancedRail,
} from "./SocraticIntakeWizardDeferredPanels";
import { GuidedIntakeRequestError } from "./GuidedIntakeRequestError";
import { IntakeFieldLabel } from "./IntakeFieldLabel";
import { INTAKE_STEPS, MIN_OUTCOME_CHARS } from "./guided-intake-steps";
import { useGuidedIntakeWizard } from "./use-guided-intake-wizard";

/** Guided intake: write the brief, answer required clarifications, submit the review package. */
export function SocraticIntakeWizard() {
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
    stepLabel,
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
    resolvedClarificationCount,
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
    // Gates
    canAdvanceIntent,
    canReviewAnswers,
    canSubmit,
  } = useGuidedIntakeWizard();

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
