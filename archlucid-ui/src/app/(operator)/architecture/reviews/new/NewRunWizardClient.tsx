"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
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
import type { WizardEvidenceUploadTrackState } from "@/components/wizard/steps/WizardPostCreateEvidenceUploadPanel";
import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardStepPreset } from "@/components/wizard/steps/WizardStepPreset";
import { WizardStepReview } from "@/components/wizard/steps/WizardStepReview";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { LlmUsageBandHint } from "@/components/LlmUsageBandHint";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";
import { listRunsByProjectPaged } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isAcceleratorPackId, resolveAcceleratorWizardPreset } from "@/lib/accelerator-wizard-presets";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";
import { applyWizardPreset } from "@/lib/wizard-presets";
import {
  parseWizardPresetDeeplinkToken,
  resolveWizardPresetIdFromDeeplink,
  resolveWizardPresetValuesFromDeeplink,
} from "@/lib/wizard-preset-deeplink";
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
import {
  uploadWizardPendingAzureEvidence,
  uploadWizardPendingDocumentEvidence,
} from "@/lib/wizard-pending-evidence-upload";
import { useWizardBaselineMetricsActions } from "@/lib/use-wizard-baseline-metrics-actions";
import {
  resolveReviewIntakeExampleTemplateFromSearchParams,
  type ReviewIntakeExampleTemplate,
} from "@/lib/operator-home-example-request";
import { resolveSpecialtyReviewCloudFromSearchParam } from "@/lib/specialty-review-templates";
import {
  buildDefaultWizardValues,
  wizardFormSchema,
  type WizardFormValues,
} from "@/lib/wizard-schema";
import { WizardAiSuggestedFieldsProvider } from "@/lib/wizard-ai-suggested-fields";
import { trackWizardValidationFailed } from "@/lib/telemetry";
import {
  resolveFirstRunWizardMode,
  shouldShowWizardModeToggle,
} from "@/lib/core-pilot-step-presentation";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import {
  applyBundledSamplePackageToWizard,
  isZeroConfigDemoQuery,
  resolveZeroConfigDemoScenarioId,
} from "@/lib/zero-config-demo-mode";
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
  WizardStepAzureContext,
  WizardStepBaselineMetrics,
  WizardStepBaselineZip,
  WizardStepTrack,
} from "./NewRunWizardDeferredChunks";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";
const WIZARD_STEP_DEFINITIONS_FULL = [
  { label: "Choose starting point", description: "Template, import, or blank" },
  { label: "Evidence (optional)", description: "Brief, docs, IaC, cloud export, or demo" },
  { label: "Identity & goals", description: "System, environment & requirements" },
  { label: "Constraints", description: "Limits & capabilities" },
  { label: "Optional enrichment", description: "Cloud inventory or supporting files — optional" },
  { label: "Advanced", description: "Optional context" },
  { label: "Baseline metrics (optional)", description: "ROI reporting inputs" },
  { label: "Review", description: "Confirm & create" },
  { label: "Pipeline", description: "Track progress" },
] as const;

const WIZARD_STEP_DEFINITIONS_BASELINE = [
  WIZARD_STEP_DEFINITIONS_FULL[0],
  { label: "Add evidence", description: "Optional cloud inventory or sample review evidence" },
  WIZARD_STEP_DEFINITIONS_FULL[2],
  WIZARD_STEP_DEFINITIONS_FULL[3],
  WIZARD_STEP_DEFINITIONS_FULL[4],
  WIZARD_STEP_DEFINITIONS_FULL[5],
  WIZARD_STEP_DEFINITIONS_FULL[6],
  WIZARD_STEP_DEFINITIONS_FULL[7],
  WIZARD_STEP_DEFINITIONS_FULL[8],
] as const;

const STEP_INDEX_MAX_FULL = WIZARD_STEP_DEFINITIONS_FULL.length - 1;
const STEP_INDEX_MAX_BASELINE = WIZARD_STEP_DEFINITIONS_BASELINE.length - 1;

function macroWizardStepIndex(stepIndex: number, baselineFirst: boolean): number {
  if (!baselineFirst) {
    if (stepIndex <= 2) {
      return 0;
    }

    if (stepIndex <= 5) {
      return 1;
    }

    if (stepIndex <= 7) {
      return 2;
    }

    return 3;
  }

  if (stepIndex <= 2) {
    return 0;
  }

  if (stepIndex <= 5) {
    return 1;
  }

  if (stepIndex <= 7) {
    return 2;
  }

  return 3;
}

function macroCompletedSteps(stepIndex: number, baselineFirst: boolean): number[] {
  const macro = macroWizardStepIndex(stepIndex, baselineFirst);

  return Array.from({ length: macro }, (_, index) => index);
}

/** High-level phases (four sponsor-visible milestones across internal wizard slides). */
const MACRO_WIZARD_STEP_DEFINITIONS = [
  { label: "Request brief", description: "Starting point through architecture brief" },
  { label: "Depth & evidence", description: "Constraints and advanced inputs" },
  { label: "Review & submit", description: "Confirm before creation" },
  { label: "Pipeline", description: "Execution visibility" },
] as const;

const SAMPLE_RUN_GUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[0-9a-fA-F]{32}$/;

function tryParseSampleRunQuery(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0 || !SAMPLE_RUN_GUID_RE.test(trimmed)) {
    return null;
  }

  if (trimmed.includes("-")) {
    return trimmed;
  }

  const n = trimmed.toLowerCase();

  return `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20, 32)}`;
}

/** Full wizard client: react-hook-form + zod, create run, poll summary with live region + toast. */
export function NewRunWizardClient() {
  const searchParams = useSearchParams();
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const featuredSampleRunId = useMemo(() => {
    const raw = searchParams?.get("sampleRunId") ?? null;

    return tryParseSampleRunQuery(raw);
  }, [searchParams]);
  const baselineFirst = useMemo(() => searchParams?.get("baseline") === "1", [searchParams]);
  const acceleratorPackId = useMemo(() => {
    const raw = searchParams?.get("accelerator")?.trim() ?? "";

    if (!isAcceleratorPackId(raw)) {
      return null;
    }

    return raw;
  }, [searchParams]);
  const followUpSourceRunId = useMemo(() => {
    const raw = searchParams?.get("sourceRunId") ?? null;

    return tryParseSampleRunQuery(raw);
  }, [searchParams]);
  const zeroConfigDemo = useMemo(() => isZeroConfigDemoQuery(searchParams), [searchParams]);
  const zeroConfigScenarioId = useMemo(
    () => resolveZeroConfigDemoScenarioId(searchParams),
    [searchParams],
  );
  const exampleTemplateResolution = useMemo(
    () => resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null),
    [searchParams],
  );
  const exampleTemplate: ReviewIntakeExampleTemplate | null = exampleTemplateResolution.template;
  const reviewIntakeCloudProvider = useMemo(
    () => resolveSpecialtyReviewCloudFromSearchParam(searchParams?.get("cloud")),
    [searchParams],
  );
  const zeroConfigAppliedRef = useRef(false);
  const exampleTemplatePrefillAppliedRef = useRef(false);
  const stepDefinitions = baselineFirst ? WIZARD_STEP_DEFINITIONS_BASELINE : WIZARD_STEP_DEFINITIONS_FULL;
  const reviewStepIndex: number = 7;
  const trackStepIndex: number = 8;

  const { stepIndex, setStepIndex, goBack, goToStep, advance, isFirstStep, isReviewStep } =
    useWizardStepNavigation({
      steps: stepDefinitions,
      telemetryWizardName: "FullGuided",
      reviewStepIndex,
    });

  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [advancedConfigurationOptIn, setAdvancedConfigurationOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const creationProgress = useReviewCreationProgress();
  const [runId, setRunId] = useState<string | null>(null);
  const [trackPollSession, setTrackPollSession] = useState(0);
  const [pendingEvidenceFile, setPendingEvidenceFile] = useState<File | null>(null);
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState<File[]>([]);
  const [evidenceUploadState, setEvidenceUploadState] = useState<WizardEvidenceUploadTrackState>("idle");
  const [evidenceUploadProgressPercent, setEvidenceUploadProgressPercent] = useState<number | null>(null);
  const [evidenceUploadError, setEvidenceUploadError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const {
    baselineReviewCycleHours,
    setBaselineReviewCycleHours,
    baselineConfidence,
    setBaselineConfidence,
    baselineMetricsError,
    setBaselineMetricsError,
    persistBaselineMetricsIfNeeded,
  } = useWizardBaselineMetricsActions();
  const [wizardMode, setWizardMode] = useState<"quick" | "full">(() => {
    if (typeof window === "undefined") {
      return "quick";
    }

    try {
      const stored = window.localStorage.getItem(WIZARD_MODE_STORAGE_KEY);
      if (stored === "quick" || stored === "full") {
        return stored;
      }
    } catch {
      /* ignore */
    }

    return "quick";
  });
  const [wizardModeReady] = useState(true);
  const liveRef = useRef<HTMLDivElement>(null);
  const wizardReadyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wizardReadyRef.current?.setAttribute("data-wizard-ready", "true");
  }, []);

  const { summary: pollSummary } = useRunSummaryStream(runId, {
    enabled: runId !== null && (wizardMode === "quick" ? true : stepIndex === trackStepIndex),
    retryToken: trackPollSession,
  });

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: buildDefaultWizardValues(),
    mode: "onBlur",
  });

  const { trigger, getValues, setValue, reset, control } = form;
  const handlePendingEvidenceFileChange = useCallback(
    (file: File | null) => {
      setPendingEvidenceFile(file);

      if (file !== null) {
        setValue("cloudProvider", "Azure", { shouldValidate: true, shouldDirty: true });
      }
    },
    [setValue],
  );

  const recapSystemName = useWatch({ control, name: "systemName" })?.trim() ?? "";
  const recapEnvironment = useWatch({ control, name: "environment" })?.trim() ?? "";
  const recapCloud = useWatch({ control, name: "cloudProvider" })?.trim() ?? "";
  const recapDescription = useWatch({ control, name: "description" })?.trim() ?? "";
  const recapConstraintsList = useWatch({ control, name: "constraints" });
  const recapConstraints =
    Array.isArray(recapConstraintsList) && recapConstraintsList.length > 0
      ? recapConstraintsList.map((c) => String(c).trim()).filter((c) => c.length > 0).join(", ")
      : "";
  const watchedWizardValues = useWatch({ control }) as WizardFormValues;
  const templateWizardSessionState = useMemo(
    () => watchedWizardValues ?? getValues(),
    [getValues, watchedWizardValues],
  );

  const presetDeeplinkToken = useMemo(
    () => parseWizardPresetDeeplinkToken(searchParams?.get("preset")),
    [searchParams],
  );

  const presetDeeplinkPresetId = useMemo(
    () => resolveWizardPresetIdFromDeeplink(searchParams?.get("preset")),
    [searchParams],
  );

  useEffect(() => {
    if (!baselineFirst) {
      return;
    }

    setWizardMode("quick");

    try {
      window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "quick");
    } catch {
      /* ignore */
    }
  }, [baselineFirst]);

  useEffect(() => {
    if (acceleratorPackId === null) {
      return;
    }

    const preset = resolveAcceleratorWizardPreset(acceleratorPackId);

    if (preset === null) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), preset));
    goToStep(1);

    if (!baselineFirst) {
      setWizardMode("full");

      try {
        window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");
      } catch {
        /* ignore */
      }
    }
  }, [acceleratorPackId, baselineFirst, reset]);

  useEffect(() => {
    if (presetDeeplinkToken === null || presetDeeplinkPresetId === null) {
      return;
    }

    if (baselineFirst || acceleratorPackId !== null) {
      return;
    }

    const presetValues = resolveWizardPresetValuesFromDeeplink(presetDeeplinkToken);

    if (presetValues === null) {
      return;
    }

    reset(applyWizardPreset(buildDefaultWizardValues(), presetValues));
    goToStep(1);
    setWizardMode("full");

    try {
      window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "full");
    } catch {
      /* ignore */
    }
  }, [acceleratorPackId, baselineFirst, presetDeeplinkPresetId, presetDeeplinkToken, reset]);

  useEffect(() => {
    if (baselineFirst) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(WIZARD_MODE_STORAGE_KEY) : null;

        if (stored === "quick" || stored === "full") {
          return;
        }

        const page = await listRunsByProjectPaged("default", 1, 50);
        const anyCommitted = page.items.some((r) => r.hasGoldenManifest === true);
        const storedMode = stored === "quick" || stored === "full" ? stored : null;

        if (!cancelled) {
          setWizardMode(
            resolveFirstRunWizardMode({
              hasCommittedManifest: anyCommitted,
              storedMode,
            }),
          );
        }
      } catch {
        if (!cancelled) {
          setWizardMode("quick");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baselineFirst]);

  useEffect(() => {
    if (exampleTemplate === null || wizardMode !== "full" || stepIndex !== 2) {
      return;
    }

    if (exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    exampleTemplatePrefillAppliedRef.current = true;
    setValue("systemName", exampleTemplate.systemName, { shouldValidate: true, shouldDirty: true });
    setValue("description", exampleTemplate.briefText, { shouldValidate: true, shouldDirty: true });

    if (reviewIntakeCloudProvider !== null) {
      setValue("cloudProvider", reviewIntakeCloudProvider, { shouldValidate: true, shouldDirty: true });
    }
  }, [exampleTemplate, reviewIntakeCloudProvider, setValue, stepIndex, wizardMode]);

  useEffect(() => {
    if (stepIndex !== reviewStepIndex) {
      setSubmitError(null);
    }
  }, [stepIndex, reviewStepIndex]);

  const isCreating = submitting || creationProgress.isActive;
  const canProceed = !isCreating;
  const canSubmit = !isCreating && !blocksLlmExecution;

  const showToast = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      showSuccess(message);
    } else {
      showError("Wizard", message);
    }
  }, []);

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

  const completedMacroSteps: number[] = macroCompletedSteps(stepIndex, baselineFirst);
  const macroStep: number = macroWizardStepIndex(stepIndex, baselineFirst);

  const liveMessage =
    runId === null
      ? "No review started yet."
      : pollSummary
        ? `Review ${runId} polled: context ${pollSummary.hasContextSnapshot ? "ready" : "pending"}, graph ${pollSummary.hasGraphSnapshot ? "ready" : "pending"}, findings ${pollSummary.hasFindingsSnapshot ? "ready" : "pending"}, signed review record ${pollSummary.hasGoldenManifest ? "ready" : "pending"}.`
        : `Review ${runId} created; loading summary.`;

  const persistWizardMode = useCallback((mode: "quick" | "full") => {
    setWizardMode(mode);

    try {
      window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const uploadPendingEvidence = useCallback(async (runIdValue: string): Promise<void> => {
    const azureFile = pendingEvidenceFile;
    const documentFiles = pendingDocumentFiles;
    const hasAzure = azureFile !== null;
    const hasDocuments = documentFiles.length > 0;

    if (!hasAzure && !hasDocuments) {
      return;
    }

    setEvidenceUploadState("uploading");
    setEvidenceUploadError(null);
    setEvidenceUploadProgressPercent(null);

    if (hasAzure && azureFile !== null) {
      const azureResult = await uploadWizardPendingAzureEvidence(runIdValue, azureFile, {
        onUploadProgress: (percent) => {
          setEvidenceUploadProgressPercent(percent);
        },
      });

      if (!azureResult.ok) {
        setEvidenceUploadState("failed");
        setEvidenceUploadProgressPercent(null);
        setEvidenceUploadError({
          message: azureResult.message,
          problem: azureResult.problem,
          correlationId: azureResult.correlationId,
        });

        return;
      }

      setPendingEvidenceFile(null);
    }

    if (documentFiles.length > 0) {
      const documentResult = await uploadWizardPendingDocumentEvidence(runIdValue, documentFiles);

      if (!documentResult.ok) {
        setEvidenceUploadState("failed");
        setEvidenceUploadError({
          message: documentResult.message,
          problem: documentResult.problem,
          correlationId: documentResult.correlationId,
        });

        return;
      }

      setPendingDocumentFiles([]);
    }

    setEvidenceUploadState("success");
    setEvidenceUploadProgressPercent(null);
  }, [pendingDocumentFiles, pendingEvidenceFile]);

  const retryEvidenceUpload = useCallback(async () => {
    if (runId === null) {
      return;
    }

    if (pendingEvidenceFile === null && pendingDocumentFiles.length === 0) {
      return;
    }

    await uploadPendingEvidence(runId);
  }, [pendingDocumentFiles, pendingEvidenceFile, runId, uploadPendingEvidence]);

  useEffect(() => {
    if (runId === null || wizardMode !== "quick") {
      return;
    }

    if (pendingEvidenceFile === null && pendingDocumentFiles.length === 0) {
      return;
    }

    if (evidenceUploadState !== "idle") {
      return;
    }

    void uploadPendingEvidence(runId);
  }, [
    evidenceUploadState,
    pendingDocumentFiles,
    pendingEvidenceFile,
    runId,
    uploadPendingEvidence,
    wizardMode,
  ]);

  const skipEvidenceAndAdvance = () => {
    setPendingEvidenceFile(null);
    setPendingDocumentFiles([]);
    advance();
  };

  const tryWithDemoData = useCallback(
    (scenarioId: AzureExtractorDemoScenarioId) => {
      const applied = applyBundledSamplePackageToWizard(setValue, handlePendingEvidenceFileChange, scenarioId);

      if (!applied.ok) {
        showToast("err", applied.message);

        return;
      }

      showToast("ok", "Demo Azure package loaded — it uploads automatically after the review is created.");
      advance();
    },
    [handlePendingEvidenceFileChange, setValue, showToast, advance],
  );

  useEffect(() => {
    if (!zeroConfigDemo || zeroConfigAppliedRef.current) {
      return;
    }

    zeroConfigAppliedRef.current = true;
    persistWizardMode("full");

    const applied = applyBundledSamplePackageToWizard(
      setValue,
      handlePendingEvidenceFileChange,
      zeroConfigScenarioId,
    );

    if (!applied.ok) {
      showToast("err", applied.message);

      return;
    }

    goToStep(2);
    showToast("ok", "Demo Azure package loaded — confirm identity and submit your review.");
  }, [zeroConfigDemo, zeroConfigScenarioId, goToStep, handlePendingEvidenceFileChange, persistWizardMode, setValue, showToast]);

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
      goToStep(trackStepIndex);
      templateWizardSession.clearSession();
      showToast("ok", `Architecture review ${id} created — tracking pipeline below.`);

      if (pendingEvidenceFile !== null || pendingDocumentFiles.length > 0) {
        await uploadPendingEvidence(id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showNav: boolean = stepIndex < trackStepIndex;
  const showQuickTrack = wizardMode === "quick" && runId !== null;
  const showFullWizardShell = wizardMode === "full" && !showQuickTrack;
  const showSimplifiedPilotWizard = baselineFirst && wizardMode === "quick" && !showQuickTrack;
  const showQuickStartWizard = !baselineFirst && wizardMode === "quick" && !showQuickTrack;
  const showWizardModeToggle = shouldShowWizardModeToggle(
    commitPresentationContext.hasCommittedManifest,
    advancedConfigurationOptIn,
  );
  const showFirstRunProgressBanner =
    wizardModeReady &&
    wizardMode === "quick" &&
    !showQuickTrack &&
    !commitPresentationContext.hasCommittedManifest;
  const fullWizardStepCountLabel: number = baselineFirst
    ? WIZARD_STEP_DEFINITIONS_BASELINE.length
    : WIZARD_STEP_DEFINITIONS_FULL.length;
  const quickModeLabel = baselineFirst ? "Pilot baseline (4 steps)" : "Quick start (3 steps)";
  const handleTemplateWizardRestore = useCallback(
    (snapshot: { stepIndex: number; state: WizardFormValues }) => {
      setStepIndex(snapshot.stepIndex);
      reset(snapshot.state);
    },
    [reset],
  );
  const templateWizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewTemplates,
    stepIndex,
    state: templateWizardSessionState,
    enabled: wizardModeReady && showFullWizardShell,
    hasSaveableContent: (state, currentStep) =>
      currentStep > 0 ||
      wizardSessionHasTextContent(state.systemName) ||
      wizardSessionHasTextContent(state.description),
    onRestore: handleTemplateWizardRestore,
  });

  return (
    <FormProvider {...form}>
      <WizardAiSuggestedFieldsProvider>
      <OperatorPageContainer ref={wizardReadyRef} variant="workflow" className="space-y-4 pb-36">
          {!wizardModeReady ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>Loading wizard…</p>
          ) : null}
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
          {wizardModeReady ? (
            showWizardModeToggle ? (
            <div
              className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
              role="group"
              aria-label="Steps inside full guided review"
              data-testid="new-run-wizard-mode-toggle"
            >
              <span className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                Inside full guided review
              </span>
              <button
                type="button"
                className={
                  wizardMode === "quick"
                    ? cn("rounded-md bg-teal-600 px-3 py-1.5 text-white", OPERATOR_TYPOGRAPHY.button)
                    : cn(
                        "rounded-md px-3 py-1.5 text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800",
                        OPERATOR_TYPOGRAPHY.body,
                      )
                }
                aria-pressed={wizardMode === "quick"}
                onClick={() => persistWizardMode("quick")}
              >
                {quickModeLabel}
              </button>
              <button
                type="button"
                className={
                  wizardMode === "full"
                    ? cn("rounded-md bg-teal-600 px-3 py-1.5 text-white", OPERATOR_TYPOGRAPHY.button)
                    : cn(
                        "rounded-md px-3 py-1.5 text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800",
                        OPERATOR_TYPOGRAPHY.body,
                      )
                }
                aria-pressed={wizardMode === "full"}
                onClick={() => persistWizardMode("full")}
              >
                All steps ({fullWizardStepCountLabel})
              </button>
            </div>
            ) : (
              <div
                className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="new-run-wizard-advanced-opt-in"
              >
                <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">Quick start (3 steps)</span>
                  {" — recommended for your first review. Constraints, optional evidence, and advanced fields use safe defaults."}
                </p>
                <button
                  type="button"
                  className={cn(
                    "mt-2 rounded-md px-3 py-1.5 text-teal-900 underline decoration-teal-700/40 underline-offset-2 hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-teal-950/40",
                    OPERATOR_TYPOGRAPHY.button,
                  )}
                  onClick={() => {
                    setAdvancedConfigurationOptIn(true);
                    persistWizardMode("full");
                  }}
                >
                  Show all wizard steps (advanced configuration)
                </button>
              </div>
            )
          ) : null}

          {wizardModeReady && isOperatorExperienceFullShellEnv() && llmBudgetStatus !== null ? (
            <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} />
          ) : null}

          {wizardModeReady && wizardMode === "quick" && showQuickTrack && runId ? (
            <>
              <WizardPostCreateEvidenceUploadPanel
                pendingFile={pendingEvidenceFile}
                pendingDocumentFileCount={pendingDocumentFiles.length}
                uploadState={evidenceUploadState}
                uploadProgressPercent={evidenceUploadProgressPercent}
                uploadError={evidenceUploadError}
                onRetry={() => {
                  void retryEvidenceUpload();
                }}
              />
              <WizardStepTrack
                runId={runId}
                pollSummary={pollSummary}
                onRetryPolling={() => setTrackPollSession((session) => session + 1)}
              />
            </>
          ) : null}

          {wizardModeReady && showSimplifiedPilotWizard ? (
            <SimplifiedPilotWizard
              key="simplified-pilot"
              blocksLlmExecution={blocksLlmExecution}
              llmBudgetStatus={llmBudgetStatus}
              onPendingZipFileChange={handlePendingEvidenceFileChange}
              onRunCreated={(id) => {
                setRunId(id);
              }}
            />
          ) : null}

          {wizardModeReady && showQuickStartWizard ? (
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

          {wizardModeReady && showFullWizardShell && presetDeeplinkPresetId !== null ? (
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

          {wizardModeReady && showFullWizardShell ? (
            <>
          {templateWizardSession.pendingRestore !== null ? (
            <WizardSessionResumePrompt
              onResume={templateWizardSession.acceptRestore}
              onDismiss={templateWizardSession.dismissRestore}
            />
          ) : null}
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

          {stepIndex >= 2 && stepIndex <= reviewStepIndex && !(baselineFirst && stepIndex === 1) ? (
            <div
              className={cn(
                "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="new-run-wizard-step-recap"
            >
              <strong className="font-semibold">Request so far:</strong>{" "}
              {recapSystemName.length > 0 ? (
                <span>
                  <span className="text-neutral-600 dark:text-neutral-400">System</span> {recapSystemName}
                  {recapEnvironment.length > 0 ? (
                    <>
                      {" "}
                      · <span className="text-neutral-600 dark:text-neutral-400">Env</span> {recapEnvironment}
                    </>
                  ) : null}
                  {recapCloud.length > 0 ? (
                    <>
                      {" "}
                      · <span className="text-neutral-600 dark:text-neutral-400">Cloud</span> {recapCloud}
                    </>
                  ) : null}
                </span>
              ) : (
                <span className="text-neutral-600 dark:text-neutral-400">Add identity on this step.</span>
              )}
              {stepIndex >= 3 && recapDescription.length > 0 ? (
                <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-600 dark:text-neutral-400">Brief:</span>{" "}
                  {recapDescription.length > 180 ? `${recapDescription.slice(0, 177)}…` : recapDescription}
                </span>
              ) : null}
              {stepIndex >= 4 && recapConstraints.length > 0 ? (
                <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-600 dark:text-neutral-400">Constraints noted:</span>{" "}
                  {recapConstraints.length > 120 ? `${recapConstraints.slice(0, 117)}…` : recapConstraints}
                </span>
              ) : null}
            </div>
          ) : null}

          {stepIndex === 0 ? (
            <WizardStepPreset
              baselineFirst={baselineFirst}
              featuredSampleRunId={featuredSampleRunId}
              onStartingPointCommitted={() => goToStep(1)}
              onWizardNotice={(kind, message) => showToast(kind === "ok" ? "ok" : "err", message)}
            />
          ) : null}
          {stepIndex === FULL_WIZARD_EVIDENCE_STEP_INDEX && !baselineFirst ? (
            <WizardStepEvidenceUpload
              pendingFile={pendingEvidenceFile}
              pendingDocumentFiles={pendingDocumentFiles}
              onPendingFileChange={handlePendingEvidenceFileChange}
              onPendingDocumentFilesChange={setPendingDocumentFiles}
              onTryDemoData={tryWithDemoData}
              onSkipDemoData={skipEvidenceAndAdvance}
            />
          ) : null}
          {stepIndex === 1 && baselineFirst ? (
            <WizardStepBaselineZip onPendingZipFileChange={handlePendingEvidenceFileChange} />
          ) : null}
          {stepIndex === 2 ? (
            <div className="space-y-8">
              <PilotModePolicyPackToggle
                enabled={focusedPilotModeEnabled}
                onEnabledChange={setFocusedPilotModeEnabled}
              />
              <WizardStepIdentity />
              <WizardStepDescription />
            </div>
          ) : null}
          {stepIndex === 3 ? <WizardStepConstraints /> : null}
          {stepIndex === 4 ? <WizardStepAzureContext /> : null}
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
          {stepIndex === reviewStepIndex ? <WizardStepReview /> : null}
          {stepIndex === trackStepIndex && runId ? (
            <>
              <WizardPostCreateEvidenceUploadPanel
                pendingFile={pendingEvidenceFile}
                pendingDocumentFileCount={pendingDocumentFiles.length}
                uploadState={evidenceUploadState}
                uploadProgressPercent={evidenceUploadProgressPercent}
                uploadError={evidenceUploadError}
                onRetry={() => {
                  void retryEvidenceUpload();
                }}
              />
              <WizardStepTrack
                runId={runId}
                pollSummary={pollSummary}
                onRetryPolling={() => setTrackPollSession((session) => session + 1)}
              />
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

          {stepIndex === trackStepIndex && !runId ? (
            <p className={cn("text-red-600", OPERATOR_TYPOGRAPHY.body)}>Review id missing; cannot track pipeline.</p>
          ) : null}

            </>
          ) : null}

          {wizardModeReady ? (
            <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only">
              {liveMessage}
            </div>
          ) : null}

          {wizardModeReady && isBuyerPolishedOperatorShellEnv() ? (
            <div className="mt-6" data-testid="new-run-wizard-llm-usage-band-footer">
              <LlmUsageBandHint />
            </div>
          ) : null}
        </OperatorPageContainer>
      </WizardAiSuggestedFieldsProvider>
      </FormProvider>
  );
}
