"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import {
  resolveNewRunWizardCompleteSetupEmphasizedStepId,
  resolveNewRunWizardCompleteSetupSteps,
} from "@/lib/new-run-wizard-complete-setup-checklist";
import { showError, showSuccess } from "@/lib/toast";
import {
  deriveWizardPolicyPackCloudMismatch,
  type WizardCreateRunPayloadOptions,
} from "@/lib/wizard-payload";
import {
  getWizardStepFieldGroup,
  FULL_WIZARD_BASELINE_METRICS_STEP_INDEX,
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
import { useNewRunWizardSubmit } from "./use-new-run-wizard-submit";
import { useNewRunWizardTemplateRestore } from "./NewRunWizardTemplateRestore";
import { NewRunWizardStepBody } from "./NewRunWizardStepBody";
import { WizardPostCreateEvidenceUploadPanel, WizardStepTrack } from "./NewRunWizardDeferredChunks";

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

  /**
   * Payload options shared by the live mismatch banner, the pre-submit gates, and the create call.
   * They must agree: a gate that evaluates different options than the create call would let a run
   * through that the server then rejects.
   */
  const payloadOptions: WizardCreateRunPayloadOptions = useMemo(
    () => ({
      requestSource: "wizard",
      wizardPresetUsed: presetDeeplinkToken ?? undefined,
      focusedPilotModeEnabled,
    }),
    [focusedPilotModeEnabled, presetDeeplinkToken],
  );
  const policyPackCloudMismatch = useMemo(
    () => deriveWizardPolicyPackCloudMismatch(templateWizardSessionState, payloadOptions),
    [payloadOptions, templateWizardSessionState],
  );

  const showQuickTrack = wizardMode === "quick" && runId !== null;
  const effectiveShowFullWizardShell = wizardMode === "full" && !showQuickTrack;

  const {
    templateWizardSession,
    suppressWizardResumePrompt,
    saveWizardDraft,
    clearWizardSessionRef,
  } = useNewRunWizardTemplateRestore({
    stepIndex,
    templateWizardSessionState,
    showFullWizardShell: effectiveShowFullWizardShell,
    reset,
    setStepIndex,
    getValues,
  });

  const {
    submitError,
    creationProgress,
    isCreating,
    canProceed,
    canSubmit,
    submitRun,
    recheckUnresolvedRun,
  } = useNewRunWizardSubmit({
    trigger,
    getValues,
    blocksLlmExecution,
    payloadOptions,
    presetDeeplinkToken,
    policyPackCloudMismatch,
    stepIndex,
    goToStep,
    setRunId,
    showToast,
    clearWizardSession: () => {
      clearWizardSessionRef.current();
    },
    hasPendingEvidence: evidence.hasPendingEvidence,
    uploadPendingEvidence: evidence.uploadPendingEvidence,
  });

  const macroStep: number = macroWizardStepIndex(stepIndex);
  const completedMacroSteps: number[] = macroCompletedSteps(stepIndex);
  const wizardCompleteSetupSteps = resolveNewRunWizardCompleteSetupSteps({
    identityConfigured: stepIndex >= 2 && (watchedWizardValues?.systemName?.trim().length ?? 0) > 0,
    evidenceConfigured: stepIndex > 1 || evidence.hasPendingEvidence,
    reviewStarted: runId !== null,
  });
  const wizardCompleteSetupEmphasizedStepId = resolveNewRunWizardCompleteSetupEmphasizedStepId({
    identityConfigured: stepIndex >= 2 && (watchedWizardValues?.systemName?.trim().length ?? 0) > 0,
    evidenceConfigured: stepIndex > 1 || evidence.hasPendingEvidence,
    reviewStarted: runId !== null,
  });

  const liveMessage =
    runId === null
      ? "No review started yet."
      : pollSummary
        ? `Review ${runId} polled: context ${pollSummary.hasContextSnapshot ? "ready" : "pending"}, graph ${pollSummary.hasGraphSnapshot ? "ready" : "pending"}, findings ${pollSummary.hasFindingsSnapshot ? "ready" : "pending"}, Finalized review record ${pollSummary.hasGoldenManifest ? "ready" : "pending"}.`
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
        { platform: "azure", scenarioId },
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

  const showNav: boolean = stepIndex < TRACK_STEP_INDEX;
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
  const showDetailedPathStepperChrome = effectiveShowFullWizardShell && !(embeddedInPathSwitcher && stepIndex === 0);
  const fullWizardStepCountLabel: number = stepDefinitions.length;
  const quickModeLabel = baselineFirst ? "Pilot baseline (4 steps)" : "Quick start (3 steps)";
  const showStepRecap =
    stepIndex >= 2 && stepIndex <= REVIEW_STEP_INDEX && !(baselineFirst && stepIndex === 1);

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
    <NewRunWizardStepBody
      embeddedInPathSwitcher={embeddedInPathSwitcher}
      followUpSourceRunId={followUpSourceRunId}
      exampleTemplate={exampleTemplate}
      showFirstRunProgressBanner={showFirstRunProgressBanner}
      wizardMode={wizardMode}
      quickModeLabel={quickModeLabel}
      fullWizardStepCountLabel={fullWizardStepCountLabel}
      showWizardModeToggle={showWizardModeToggle}
      persistWizardMode={persistWizardMode}
      onAdvancedOptIn={() => {
        setAdvancedConfigurationOptIn(true);
        persistWizardMode("full");
      }}
      llmBudgetStatus={llmBudgetStatus}
      showQuickTrack={showQuickTrack}
      postCreateEvidencePanel={postCreateEvidencePanel}
      pipelineTrackPanel={pipelineTrackPanel}
      showSimplifiedPilotWizard={showSimplifiedPilotWizard}
      blocksLlmExecution={blocksLlmExecution}
      onRunCreated={setRunId}
      showQuickStartWizard={showQuickStartWizard}
      presetDeeplinkPresetId={presetDeeplinkPresetId}
      presetDeeplinkToken={presetDeeplinkToken}
      showFullWizardShell={effectiveShowFullWizardShell}
      templateWizardSession={templateWizardSession}
      suppressWizardResumePrompt={suppressWizardResumePrompt}
      showDetailedPathStepperChrome={showDetailedPathStepperChrome}
      macroStep={macroStep}
      stepIndex={stepIndex}
      stepDefinitions={stepDefinitions}
      completedMacroSteps={completedMacroSteps}
      wizardCompleteSetupSteps={wizardCompleteSetupSteps}
      wizardCompleteSetupEmphasizedStepId={wizardCompleteSetupEmphasizedStepId}
      showStepRecap={showStepRecap}
      baselineFirst={baselineFirst}
      featuredSampleRunId={featuredSampleRunId}
      goToStep={goToStep}
      showToast={showToast}
      evidence={evidence}
      tryWithDemoData={tryWithDemoData}
      skipEvidenceAndAdvance={skipEvidenceAndAdvance}
      focusedPilotModeEnabled={focusedPilotModeEnabled}
      setFocusedPilotModeEnabled={setFocusedPilotModeEnabled}
      baselineReviewCycleHours={baselineReviewCycleHours}
      setBaselineReviewCycleHours={setBaselineReviewCycleHours}
      baselineConfidence={baselineConfidence}
      setBaselineConfidence={setBaselineConfidence}
      baselineMetricsError={baselineMetricsError}
      setBaselineMetricsError={setBaselineMetricsError}
      runId={runId}
      showNav={showNav}
      creationProgress={creationProgress}
      recheckUnresolvedRun={recheckUnresolvedRun}
      submitError={submitError}
      isReviewStep={isReviewStep}
      goBack={goBack}
      goNext={goNext}
      submitRun={submitRun}
      saveWizardDraft={saveWizardDraft}
      isCreating={isCreating}
      canProceed={canProceed}
      canSubmit={canSubmit}
      isFirstStep={isFirstStep}
      liveMessage={liveMessage}
      liveRef={liveRef}
    />
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
