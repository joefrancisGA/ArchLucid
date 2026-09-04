"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import type { WizardCreateRunPayloadOptions } from "@/lib/wizard-payload";
import {
  buildDefaultWizardValues,
  wizardFormSchema,
  type WizardFormValues,
} from "@/lib/wizard-schema";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { applyBundledSamplePackageToWizard } from "@/lib/zero-config-demo-mode";
import type { AzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  newRunWizardPilotHrefFromSearch,
  parseNewRunWizardAdvancedConfigFromSearch,
  parseNewRunWizardPilotFromSearch,
} from "@/lib/runs/new-run-wizard-pilot-url";

import { useNewRunWizardBaselineMetrics } from "./use-new-run-wizard-baseline-metrics";
import { useNewRunWizardIntakeParams } from "./use-new-run-wizard-intake-params";
import { useNewRunWizardLlmBudgetGate } from "./use-new-run-wizard-llm-budget-gate";
import { useNewRunWizardPolicyPackMismatch } from "./use-new-run-wizard-policy-pack-mismatch";
import { useNewRunWizardTrackStream } from "./use-new-run-wizard-track-stream";
import { useNewRunWizardMode } from "./use-new-run-wizard-mode";
import { useNewRunWizardPendingEvidence } from "./use-new-run-wizard-pending-evidence";
import { useNewRunWizardQueryPrefill } from "./use-new-run-wizard-query-prefill";
import { useNewRunWizardSubmit } from "./use-new-run-wizard-submit";
import { useNewRunWizardSteps } from "./use-new-run-wizard-steps";
import { useNewRunWizardTemplateRestore } from "./NewRunWizardTemplateRestore";
import { NewRunWizardStepBody, type NewRunWizardStepBodyProps } from "./NewRunWizardStepBody";
import { WizardPostCreateEvidenceUploadPanel, WizardStepTrack } from "./NewRunWizardDeferredChunks";

export type UseNewRunWizardClientOptions = {
  readonly embeddedInPathSwitcher?: boolean;
};

/** Orchestrates hooks/state for `NewRunWizardClient` and returns step-body props. */
export function useNewRunWizardClient(options: UseNewRunWizardClientOptions = {}) {
  const embeddedInPathSwitcher = options.embeddedInPathSwitcher === true;
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
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
  const { status: llmBudgetStatus, blocksLlmExecution } = useNewRunWizardLlmBudgetGate();
  const { wizardMode, persistWizardMode } = useNewRunWizardMode(baselineFirst);

  useEffect(() => {
    if (!embeddedInPathSwitcher || baselineFirst) {
      return;
    }

    persistWizardMode("full");
  }, [baselineFirst, embeddedInPathSwitcher, persistWizardMode]);
  const urlPilotEnabled = parseNewRunWizardPilotFromSearch(searchParams.get("pilot"));
  const urlAdvancedConfig = parseNewRunWizardAdvancedConfigFromSearch(searchParams.get("advancedConfig"));
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabledState] = useState(
    () => urlPilotEnabled ?? true,
  );
  const [advancedConfigurationOptIn, setAdvancedConfigurationOptInState] = useState(urlAdvancedConfig);

  const syncPilotTogglesToUrl = useCallback(
    (patch: {
      readonly focusedPilotModeEnabled?: boolean;
      readonly advancedConfigurationOptIn?: boolean;
    }) => {
      router.replace(newRunWizardPilotHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setFocusedPilotModeEnabled = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setFocusedPilotModeEnabledState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncPilotTogglesToUrl({ focusedPilotModeEnabled: resolved });

        return resolved;
      });
    },
    [syncPilotTogglesToUrl],
  );

  const setAdvancedConfigurationOptIn = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setAdvancedConfigurationOptInState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncPilotTogglesToUrl({ advancedConfigurationOptIn: resolved });

        return resolved;
      });
    },
    [syncPilotTogglesToUrl],
  );

  useEffect(() => {
    const nextPilot = parseNewRunWizardPilotFromSearch(searchParams.get("pilot"));

    if (nextPilot !== null) {
      setFocusedPilotModeEnabledState(nextPilot);
    }

    setAdvancedConfigurationOptInState(parseNewRunWizardAdvancedConfigFromSearch(searchParams.get("advancedConfig")));
  }, [searchParams]);

  const [runId, setRunId] = useState<string | null>(null);
  const {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  } = useNewRunWizardBaselineMetrics();
  const [stepValidationMessage, setStepValidationMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const wizardReadyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wizardReadyRef.current?.setAttribute("data-wizard-ready", "true");
  }, []);

  const showQuickTrack = wizardMode === "quick" && runId !== null;

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: buildDefaultWizardValues(),
    mode: "onBlur",
  });

  const { trigger, getValues, setValue, reset, control } = form;
  const watchedWizardValues = useWatch({ control }) as WizardFormValues;

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

  const wizardSteps = useNewRunWizardSteps({
    baselineFirst,
    embeddedInPathSwitcher,
    wizardMode,
    runId,
    showQuickTrack,
    commitPresentationContext,
    advancedConfigurationOptIn,
    watchedWizardValues,
    hasPendingEvidence: evidence.hasPendingEvidence,
    trigger,
    persistBaselineMetricsIfNeeded,
    setStepValidationMessage,
  });

  const { pollSummary, liveMessage, retryTrackPolling } = useNewRunWizardTrackStream({
    runId,
    wizardMode,
    stepIndex: wizardSteps.stepIndex,
  });

  const showWizardNotice = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      setSuccessNotice(message);
      setStepValidationMessage(null);
    } else {
      setStepValidationMessage(message);
      setSuccessNotice(null);
    }
  }, []);

  useNewRunWizardQueryPrefill({
    params,
    stepIndex: wizardSteps.stepIndex,
    wizardMode,
    reset,
    setValue,
    goToStep: wizardSteps.goToStep,
    persistWizardMode,
    onPendingEvidenceFileChange: evidence.handlePendingEvidenceFileChange,
    showToast: showWizardNotice,
  });

  const templateWizardSessionState = useMemo(
    () => watchedWizardValues ?? getValues(),
    [getValues, watchedWizardValues],
  );

  const payloadOptions: WizardCreateRunPayloadOptions = useMemo(
    () => ({
      requestSource: "wizard",
      wizardPresetUsed: presetDeeplinkToken ?? undefined,
      focusedPilotModeEnabled,
    }),
    [focusedPilotModeEnabled, presetDeeplinkToken],
  );
  const policyPackCloudMismatch = useNewRunWizardPolicyPackMismatch(templateWizardSessionState, payloadOptions);

  const {
    templateWizardSession,
    suppressWizardResumePrompt,
    saveWizardDraft,
    draftSaveFeedback,
    clearDraftSaveFeedback,
    clearWizardSessionRef,
  } = useNewRunWizardTemplateRestore({
    stepIndex: wizardSteps.stepIndex,
    templateWizardSessionState,
    showFullWizardShell: wizardSteps.effectiveShowFullWizardShell,
    reset,
    setStepIndex: wizardSteps.setStepIndex,
    getValues,
  });

  useEffect(() => {
    setStepValidationMessage(null);
    setSuccessNotice(null);
    clearDraftSaveFeedback();
  }, [clearDraftSaveFeedback, wizardSteps.stepIndex]);

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
    stepIndex: wizardSteps.stepIndex,
    goToStep: wizardSteps.goToStep,
    setRunId,
    setStepValidationMessage,
    clearWizardSession: () => {
      clearWizardSessionRef.current();
    },
    hasPendingEvidence: evidence.hasPendingEvidence,
    uploadPendingEvidence: evidence.uploadPendingEvidence,
  });

  const skipEvidenceAndAdvance = () => {
    evidence.clearPendingEvidence();
    wizardSteps.advance();
  };

  const tryWithDemoData = useCallback(
    (scenarioId: AzureExtractorDemoScenarioId) => {
      const applied = applyBundledSamplePackageToWizard(
        setValue,
        evidence.handlePendingEvidenceFileChange,
        { platform: "azure", scenarioId },
      );

      if (!applied.ok) {
        setStepValidationMessage(applied.message);

        return;
      }

      setSuccessNotice("Demo Azure package loaded — it uploads automatically after the review is created.");
      setStepValidationMessage(null);
      wizardSteps.advance();
    },
    [evidence.handlePendingEvidenceFileChange, setValue, wizardSteps],
  );

  const footerValidationMessage =
    stepValidationMessage ?? (draftSaveFeedback?.kind === "err" ? draftSaveFeedback.message : null);
  const footerSuccessNotice =
    successNotice ?? (draftSaveFeedback?.kind === "ok" ? draftSaveFeedback.message : null);

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
      onRetryPolling={retryTrackPolling}
    />
  );

  const stepBodyProps: NewRunWizardStepBodyProps = {
    embeddedInPathSwitcher,
    followUpSourceRunId,
    exampleTemplate,
    showFirstRunProgressBanner: wizardSteps.showFirstRunProgressBanner,
    wizardMode,
    quickModeLabel: wizardSteps.quickModeLabel,
    fullWizardStepCountLabel: wizardSteps.fullWizardStepCountLabel,
    showWizardModeToggle: wizardSteps.showWizardModeToggle,
    persistWizardMode,
    onAdvancedOptIn: () => {
      setAdvancedConfigurationOptIn(true);
      persistWizardMode("full");
    },
    llmBudgetStatus,
    showQuickTrack,
    postCreateEvidencePanel,
    pipelineTrackPanel,
    showSimplifiedPilotWizard: wizardSteps.showSimplifiedPilotWizard,
    blocksLlmExecution,
    onRunCreated: setRunId,
    showQuickStartWizard: wizardSteps.showQuickStartWizard,
    presetDeeplinkPresetId,
    presetDeeplinkToken,
    showFullWizardShell: wizardSteps.effectiveShowFullWizardShell,
    templateWizardSession,
    suppressWizardResumePrompt,
    showDetailedPathStepperChrome: wizardSteps.showDetailedPathStepperChrome,
    macroStep: wizardSteps.macroStep,
    stepIndex: wizardSteps.stepIndex,
    stepDefinitions: wizardSteps.stepDefinitions,
    completedMacroSteps: wizardSteps.completedMacroSteps,
    wizardCompleteSetupSteps: wizardSteps.wizardCompleteSetupSteps,
    wizardCompleteSetupEmphasizedStepId: wizardSteps.wizardCompleteSetupEmphasizedStepId,
    showStepRecap: wizardSteps.showStepRecap,
    baselineFirst,
    featuredSampleRunId,
    goToStep: wizardSteps.goToStep,
    showToast: showWizardNotice,
    evidence,
    tryWithDemoData,
    skipEvidenceAndAdvance,
    focusedPilotModeEnabled,
    setFocusedPilotModeEnabled,
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    runId,
    showNav: wizardSteps.showNav,
    creationProgress,
    recheckUnresolvedRun,
    stepValidationMessage: footerValidationMessage,
    successNotice: footerSuccessNotice,
    submitError,
    isReviewStep: wizardSteps.isReviewStep,
    goBack: wizardSteps.goBack,
    goNext: wizardSteps.goNext,
    submitRun,
    saveWizardDraft,
    isCreating,
    canProceed,
    canSubmit,
    isFirstStep: wizardSteps.isFirstStep,
    liveMessage,
    liveRef,
  };

  return {
    form,
    wizardReadyRef,
    embeddedInPathSwitcher,
    stepBody: <NewRunWizardStepBody {...stepBodyProps} />,
  };
}
