"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { CorePilotProgressTrackerBanner } from "@/components/usability/CorePilotProgressTrackerBanner";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { WizardStickyFooter } from "@/components/wizard/WizardStickyFooter";
import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardStepDescription } from "@/components/wizard/steps/WizardStepDescription";
import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepPreset } from "@/components/wizard/steps/WizardStepPreset";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { LlmUsageBandHint } from "@/components/llm/LlmUsageBandHint";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { isApiRequestError } from "@/lib/api-request-error";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import {
  evaluateWizardFormCreateRunGates,
  executeWizardFormCreateRun,
  resolveCreateRunFailureMessage,
} from "@/lib/wizard-form-create-run-submit";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE,
  REVIEW_START_SUBMIT_VALIDATION_MESSAGE,
} from "@/lib/review-start-progress-copy";
import {
  getWizardStepFieldGroup,
  FULL_WIZARD_BASELINE_METRICS_STEP_INDEX,
  FULL_WIZARD_EVIDENCE_STEP_INDEX,
} from "@/lib/wizard-step-fields";
import { useWizardBaselineMetricsActions } from "@/lib/use-wizard-baseline-metrics-actions";
import {
  buildDefaultWizardValues,
  wizardFormSchema,
  type WizardFormValues,
} from "@/lib/wizard-schema";
import { WizardAiSuggestedFieldsProvider } from "@/lib/wizard-ai-suggested-fields";
import { trackWizardValidationFailed } from "@/lib/telemetry";
import { shouldShowWizardModeToggle } from "@/lib/core-pilot-step-presentation";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { applyBundledSamplePackageToWizard } from "@/lib/zero-config-demo-mode";
import type { AzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  WIZARD_SESSION_IDS,
  wizardSessionHasTextContent,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

import {
  ArchitectureRequestWizardHelpDrawer,
  QuickStartWizard,
  SimplifiedPilotWizard,
  WizardPostCreateEvidenceUploadPanel,
  WizardStepAdvanced,
  WizardStepCloudInventoryContext,
  WizardStepBaselineMetrics,
  WizardStepBaselineZip,
  WizardStepTrack,
} from "./NewRunWizardDeferredChunks";
import { NewRunWizardModeToggle } from "./NewRunWizardModeToggle";
import { NewRunWizardStepRecap } from "./NewRunWizardStepRecap";
import {
  MACRO_WIZARD_STEP_DEFINITIONS,
  REVIEW_STEP_INDEX,
  TRACK_STEP_INDEX,
  WIZARD_STEP_DEFINITIONS_BASELINE,
  WIZARD_STEP_DEFINITIONS_FULL,
  macroCompletedSteps,
  macroWizardStepIndex,
} from "./new-run-wizard-steps";
import { useNewRunWizardIntakeParams } from "./use-new-run-wizard-intake-params";
import { useNewRunWizardMode } from "./use-new-run-wizard-mode";
import { useNewRunWizardPendingEvidence } from "./use-new-run-wizard-pending-evidence";
import { useNewRunWizardQueryPrefill } from "./use-new-run-wizard-query-prefill";

export type NewRunWizardClientProps = {
  /**
   * Panel-only mount inside `ReviewsNewPathSwitcher` (Templates and imports tab).
   * Forces templates-first full wizard and skips nested `OperatorPageContainer`.
   */
  readonly embeddedInPathSwitcher?: boolean;
};

/** Full wizard client: react-hook-form + zod, create run, poll summary with live region + toast. */
export function NewRunWizardClient(props: NewRunWizardClientProps = {}) {
  const embeddedInPathSwitcher = props.embeddedInPathSwitcher === true;
  const params = useNewRunWizardIntakeParams();
  const {
    baselineFirst,
    exampleTemplate,
    featuredSampleRunId,
    followUpSourceRunId,
    presetDeeplinkPresetId,
    presetDeeplinkToken,
  } = params;

  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const stepDefinitions = baselineFirst
    ? WIZARD_STEP_DEFINITIONS_BASELINE
    : WIZARD_STEP_DEFINITIONS_FULL;

  const { stepIndex, setStepIndex, goBack, goToStep, advance, isFirstStep, isReviewStep } =
    useWizardStepNavigation({
      steps: stepDefinitions,
      telemetryWizardName: "FullGuided",
      reviewStepIndex: REVIEW_STEP_INDEX,
    });

  const { wizardMode, persistWizardMode } = useNewRunWizardMode(baselineFirst);

  useEffect(() => {
    if (!embeddedInPathSwitcher || baselineFirst) {
      return;
    }

    persistWizardMode("full");
  }, [baselineFirst, embeddedInPathSwitcher, persistWizardMode]);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [advancedConfigurationOptIn, setAdvancedConfigurationOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const creationProgress = useReviewCreationProgress();
  const [runId, setRunId] = useState<string | null>(null);
  const [trackPollSession, setTrackPollSession] = useState(0);
  const {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  } = useWizardBaselineMetricsActions();
  const liveRef = useRef<HTMLDivElement>(null);
  const wizardReadyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wizardReadyRef.current?.setAttribute("data-wizard-ready", "true");
  }, []);

  const { summary: pollSummary } = useRunSummaryStream(runId, {
    enabled: runId !== null && (wizardMode === "quick" ? true : stepIndex === TRACK_STEP_INDEX),
    retryToken: trackPollSession,
  });

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: buildDefaultWizardValues(),
    mode: "onBlur",
  });

  const { trigger, getValues, setValue, reset, control } = form;

  const markCloudProviderFromInventory = useCallback(
    (platform: CloudInventoryPlatform) => {
      const cloudProvider =
        platform === "azure" ? "Azure" : platform === "aws" ? "Aws" : "Gcp";

      setValue("cloudProvider", cloudProvider, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const evidence = useNewRunWizardPendingEvidence({
    runId,
    autoUploadOnCreate: wizardMode === "quick",
    onInventoryFileSelected: markCloudProviderFromInventory,
  });

  const showToast = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      showSuccess(message);
    } else {
      showError("Wizard", message);
    }
  }, []);

  useNewRunWizardQueryPrefill({
    params,
    stepIndex,
    wizardMode,
    reset,
    setValue,
    goToStep,
    persistWizardMode,
    onPendingEvidenceFileChange: evidence.handlePendingEvidenceFileChange,
    showToast,
  });

  const watchedWizardValues = useWatch({ control }) as WizardFormValues;
  const templateWizardSessionState = useMemo(
    () => watchedWizardValues ?? getValues(),
    [getValues, watchedWizardValues],
  );

  useEffect(() => {
    if (stepIndex !== REVIEW_STEP_INDEX) {
      setSubmitError(null);
    }
  }, [stepIndex]);

  const isCreating = submitting || creationProgress.isActive;
  const canProceed = !isCreating;
  const canSubmit = !isCreating && !blocksLlmExecution;

  const saveWizardDraft = useCallback(() => {
    try {
      writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewTemplates, {
        stepIndex,
        state: getValues(),
      });
      showSuccess("Draft saved in this browser.");
    } catch {
      showError("Wizard", "Could not save draft.");
    }
  }, [getValues, stepIndex]);

  const macroStep: number = macroWizardStepIndex(stepIndex);
  const completedMacroSteps: number[] = macroCompletedSteps(stepIndex);

  const liveMessage =
    runId === null
      ? "No review started yet."
      : pollSummary
        ? `Review ${runId} polled: context ${pollSummary.hasContextSnapshot ? "ready" : "pending"}, graph ${pollSummary.hasGraphSnapshot ? "ready" : "pending"}, findings ${pollSummary.hasFindingsSnapshot ? "ready" : "pending"}, sealed review record ${pollSummary.hasGoldenManifest ? "ready" : "pending"}.`
        : `Review ${runId} created; loading summary.`;

  const skipEvidenceAndAdvance = () => {
    evidence.clearPendingEvidence();
    advance();
  };

  const tryWithDemoData = useCallback(
    (scenarioId: AzureExtractorDemoScenarioId) => {
      const applied = applyBundledSamplePackageToWizard(
        setValue,
        evidence.handlePendingEvidenceFileChange,
        scenarioId,
      );

      if (!applied.ok) {
        showToast("err", applied.message);

        return;
      }

      showToast("ok", "Demo Azure package loaded — it uploads automatically after the review is created.");
      advance();
    },
    [advance, evidence.handlePendingEvidenceFileChange, setValue, showToast],
  );

  const goNext = async () => {
    if (stepIndex === 0) {
      advance();

      return;
    }

    if (stepIndex === FULL_WIZARD_BASELINE_METRICS_STEP_INDEX) {
      const saved = await persistBaselineMetricsIfNeeded();

      if (!saved) {
        return;
      }

      advance();

      return;
    }

    const fieldGroup = getWizardStepFieldGroup(stepIndex, baselineFirst);

    if (fieldGroup != null) {
      const ok = await trigger(fieldGroup, { shouldFocus: true });

      if (!ok) {
        trackWizardValidationFailed(
          "FullGuided",
          stepIndex,
          stepDefinitions[stepIndex]?.label ?? "Unknown",
          "field_validation",
        );
        showToast("err", "Fix the highlighted fields before continuing.");

        return;
      }
    }

    advance();
  };

  const submitRun = async () => {
    const gateFailure = await evaluateWizardFormCreateRunGates({
      trigger,
      blocksLlmExecution,
    });

    if (gateFailure === "validation") {
      showToast("err", REVIEW_START_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    if (gateFailure === "llm-budget") {
      showToast("err", REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);

      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    creationProgress.begin({ hasTemplate: presetDeeplinkToken !== null });

    try {
      const result = await executeWizardFormCreateRun({
        getValues,
        payloadOptions: {
          requestSource: "wizard",
          wizardPresetUsed: presetDeeplinkToken ?? undefined,
          focusedPilotModeEnabled,
        },
        wizardCompletedName: "FullGuided",
      });

      if (!result.ok) {
        if (result.reason === "no-run-id") {
          creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);
          showToast("err", REVIEW_START_CREATION_FAILED_MESSAGE);

          return;
        }

        creationProgress.fail(resolveCreateRunFailureMessage(result.error));
        setSubmitError(result.error);

        if (!isApiRequestError(result.error)) {
          const message =
            result.error && typeof result.error === "object" && "message" in result.error
              ? String((result.error as { message?: string }).message)
              : "Request failed.";
          showToast("err", message);
        }

        return;
      }

      const id = result.runId;

      creationProgress.succeed();
      setRunId(id);
      goToStep(TRACK_STEP_INDEX);
      templateWizardSession.clearSession();
      showToast("ok", `Architecture review ${id} created — tracking pipeline below.`);

      if (evidence.hasPendingEvidence) {
        await evidence.uploadPendingEvidence(id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showNav: boolean = stepIndex < TRACK_STEP_INDEX;
  const showQuickTrack = wizardMode === "quick" && runId !== null;
  const showFullWizardShell = wizardMode === "full" && !showQuickTrack;
  const showSimplifiedPilotWizard = baselineFirst && wizardMode === "quick" && !showQuickTrack;
  const showQuickStartWizard = !baselineFirst && wizardMode === "quick" && !showQuickTrack;
  const showWizardModeToggle =
    !embeddedInPathSwitcher &&
    shouldShowWizardModeToggle(commitPresentationContext.hasCommittedManifest, advancedConfigurationOptIn);
  const showFirstRunProgressBanner =
    !embeddedInPathSwitcher &&
    wizardMode === "quick" &&
    !showQuickTrack &&
    !commitPresentationContext.hasCommittedManifest;
  const showDetailedPathStepperChrome = showFullWizardShell && !(embeddedInPathSwitcher && stepIndex === 0);
  const fullWizardStepCountLabel: number = stepDefinitions.length;
  const quickModeLabel = baselineFirst ? "Pilot baseline (4 steps)" : "Quick start (3 steps)";
  const showStepRecap =
    stepIndex >= 2 && stepIndex <= REVIEW_STEP_INDEX && !(baselineFirst && stepIndex === 1);

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

  const postCreateEvidencePanel = runId === null ? null : (
    <WizardPostCreateEvidenceUploadPanel
      pendingFile={evidence.pendingEvidenceFile}
      pendingDocumentFileCount={evidence.pendingDocumentFiles.length}
      uploadState={evidence.evidenceUploadState}
      uploadProgressPercent={evidence.evidenceUploadProgressPercent}
      uploadError={evidence.evidenceUploadError}
      onRetry={() => {
        void evidence.retryEvidenceUpload();
      }}
    />
  );

  const pipelineTrackPanel = runId === null ? null : (
    <WizardStepTrack
      runId={runId}
      pollSummary={pollSummary}
      onRetryPolling={() => setTrackPollSession((session) => session + 1)}
    />
  );

  const wizardBody = (
    <>
          {followUpSourceRunId !== null ? (
            <p
              className={cn(
                "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="new-run-follow-up-source-run-id"
            >
              Follow-up review for prior review{" "}
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{followUpSourceRunId}</span>. Source context is stored for a
              future wizard prefill.
            </p>
          ) : null}
          {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}
          {showFirstRunProgressBanner ? <CorePilotProgressTrackerBanner /> : null}

          <NewRunWizardModeToggle
            wizardMode={wizardMode}
            quickModeLabel={quickModeLabel}
            fullWizardStepCount={fullWizardStepCountLabel}
            showToggle={showWizardModeToggle}
            onModeChange={persistWizardMode}
            onAdvancedOptIn={() => {
              setAdvancedConfigurationOptIn(true);
              persistWizardMode("full");
            }}
          />

          {isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
            <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
          ) : null}

          {showQuickTrack ? (
            <>
              {postCreateEvidencePanel}
              {pipelineTrackPanel}
            </>
          ) : null}

          {showSimplifiedPilotWizard ? (
            <SimplifiedPilotWizard
              key="simplified-pilot"
              blocksLlmExecution={blocksLlmExecution}
              llmBudgetStatus={llmBudgetStatus}
              onPendingZipFileChange={evidence.handlePendingEvidenceFileChange}
              onRunCreated={(id) => {
                setRunId(id);
              }}
            />
          ) : null}

          {showQuickStartWizard ? (
            <QuickStartWizard
              key={wizardMode}
              blocksLlmExecution={blocksLlmExecution}
              llmBudgetStatus={llmBudgetStatus}
              initialPresetId={presetDeeplinkPresetId ?? undefined}
              exampleTemplate={exampleTemplate}
              onRunCreated={(id) => {
                setRunId(id);
              }}
            />
          ) : null}

          {showFullWizardShell && presetDeeplinkPresetId !== null ? (
            <p
              className={cn(
                "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="wizard-preset-deeplink-active"
              data-preset-id={presetDeeplinkPresetId}
            >
              Preset applied from link:{" "}
              <span className="font-medium">{presetDeeplinkToken ?? presetDeeplinkPresetId}</span>
            </p>
          ) : null}

          {showFullWizardShell ? (
            <>
          {templateWizardSession.pendingRestore !== null ? (
            <WizardSessionResumePrompt
              onResume={templateWizardSession.acceptRestore}
              onDismiss={templateWizardSession.dismissRestore}
            />
          ) : null}
          {showDetailedPathStepperChrome ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2" data-testid="new-run-wizard-progress">
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className="m-0 font-medium text-neutral-900 dark:text-neutral-100"
                    data-testid="new-run-wizard-stage-line"
                  >
                    Stage {macroStep + 1} of {MACRO_WIZARD_STEP_DEFINITIONS.length} —{" "}
                    {MACRO_WIZARD_STEP_DEFINITIONS[macroStep].label}
                  </p>
                  <p
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="new-run-wizard-step-line"
                  >
                    Step {stepIndex + 1}: {stepDefinitions[stepIndex].label}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <WizardSessionSaveStatus
                    saveState={templateWizardSession.saveState}
                    lastSavedUtc={templateWizardSession.lastSavedUtc}
                  />
                  <ArchitectureRequestWizardHelpDrawer />
                </div>
              </div>

              <WizardStepper
                steps={[...MACRO_WIZARD_STEP_DEFINITIONS]}
                currentStep={macroStep}
                completedSteps={completedMacroSteps}
              />
            </>
          ) : null}

          {showDetailedPathStepperChrome && showStepRecap ? <NewRunWizardStepRecap stepIndex={stepIndex} /> : null}

          {stepIndex === 0 ? (
            embeddedInPathSwitcher ? (
              <div data-testid="reviews-new-detailed-template-entry">
                <WizardStepPreset
                  baselineFirst={baselineFirst}
                  featuredSampleRunId={featuredSampleRunId}
                  onStartingPointCommitted={() => goToStep(1)}
                  onWizardNotice={(kind, message) => showToast(kind === "ok" ? "ok" : "err", message)}
                />
              </div>
            ) : (
              <WizardStepPreset
                baselineFirst={baselineFirst}
                featuredSampleRunId={featuredSampleRunId}
                onStartingPointCommitted={() => goToStep(1)}
                onWizardNotice={(kind, message) => showToast(kind === "ok" ? "ok" : "err", message)}
              />
            )
          ) : null}
          {stepIndex === FULL_WIZARD_EVIDENCE_STEP_INDEX && !baselineFirst ? (
            <WizardStepEvidenceUpload
              pendingFile={evidence.pendingEvidenceFile}
              pendingDocumentFiles={evidence.pendingDocumentFiles}
              onPendingFileChange={evidence.handlePendingEvidenceFileChange}
              onPendingDocumentFilesChange={evidence.setPendingDocumentFiles}
              onTryDemoData={tryWithDemoData}
              onSkipDemoData={skipEvidenceAndAdvance}
            />
          ) : null}
          {stepIndex === 1 && baselineFirst ? (
            <WizardStepBaselineZip onPendingZipFileChange={evidence.handlePendingEvidenceFileChange} />
          ) : null}
          {stepIndex === 2 ? (
            <div className={OPERATOR_LAYOUT.sectionStack}>
              <PilotModePolicyPackToggle
                enabled={focusedPilotModeEnabled}
                onEnabledChange={setFocusedPilotModeEnabled}
              />
              <WizardStepIdentity />
              <WizardStepDescription />
            </div>
          ) : null}
          {stepIndex === 3 ? <WizardStepConstraints /> : null}
          {stepIndex === 4 ? (
            <WizardStepCloudInventoryContext
              pendingFile={evidence.pendingEvidenceFile}
              onPendingFileChange={evidence.handlePendingEvidenceFileChange}
            />
          ) : null}
          {stepIndex === 5 ? <WizardStepAdvanced /> : null}
          {stepIndex === FULL_WIZARD_BASELINE_METRICS_STEP_INDEX ? (
            <WizardStepBaselineMetrics
              reviewCycleHours={baselineReviewCycleHours}
              confidence={baselineConfidence}
              fieldError={baselineMetricsError}
              onReviewCycleHoursChange={(value) => {
                setBaselineReviewCycleHours(value);

                if (baselineMetricsError !== null) {
                  setBaselineMetricsError(null);
                }
              }}
              onConfidenceChange={setBaselineConfidence}
            />
          ) : null}
          {stepIndex === REVIEW_STEP_INDEX ? <WizardStepReview /> : null}
          {stepIndex === TRACK_STEP_INDEX && runId ? (
            <>
              {postCreateEvidencePanel}
              {pipelineTrackPanel}
            </>
          ) : null}

          {showNav ? (
            <WizardStickyFooter
              testIdPrefix="new-run-wizard"
              progress={creationProgress}
              onRecheck={() => {
                void submitRun();
              }}
              submitError={submitError}
              showSubmitError={isReviewStep}
            >
              <WizardNavButtons
                onBack={goBack}
                onNext={isReviewStep ? undefined : goNext}
                onSubmit={isReviewStep ? submitRun : undefined}
                onSaveDraft={saveWizardDraft}
                submitting={isCreating}
                canProceed={canProceed}
                canSubmit={canSubmit}
                isFirstStep={isFirstStep}
                isLastInputStep={isReviewStep}
                nextLabel={stepIndex === 0 ? "Continue" : "Next"}
                submitLabel="Start Architecture Review"
                submittingLabel="Creating…"
              />
            </WizardStickyFooter>
          ) : null}

          {stepIndex === TRACK_STEP_INDEX && !runId ? (
            <p className={cn("text-red-600", OPERATOR_TYPOGRAPHY.body)}>Review id missing; cannot track pipeline.</p>
          ) : null}

            </>
          ) : null}

          <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only">
            {liveMessage}
          </div>

          {isBuyerPolishedOperatorShellEnv() ? (
            <div className="mt-6" data-testid="new-run-wizard-llm-usage-band-footer">
              <LlmUsageBandHint />
            </div>
          ) : null}
    </>
  );

  return (
    <FormProvider {...form}>
      <WizardAiSuggestedFieldsProvider>
        {embeddedInPathSwitcher ? (
          <div ref={wizardReadyRef} className="space-y-4 pb-36" data-testid="new-run-wizard-panel">
            {wizardBody}
          </div>
        ) : (
          <OperatorPageContainer ref={wizardReadyRef} variant="workflow" className="space-y-4 pb-36">
            {wizardBody}
          </OperatorPageContainer>
        )}
      </WizardAiSuggestedFieldsProvider>
    </FormProvider>
  );
}
