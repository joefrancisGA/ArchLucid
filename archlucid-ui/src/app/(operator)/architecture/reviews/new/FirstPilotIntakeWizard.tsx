"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { LlmMonthlyBudgetExceededBanner } from "@/components/llm/LlmMonthlyBudgetExceededBanner";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import { ArchitectureScopeUnderstandingCheckPanel } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { QuickStartL0MustQuestionsPanel } from "@/components/architecture/QuickStartL0MustQuestionsPanel";
import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { PreExecuteCostEstimateNotice } from "@/components/usability/PreExecuteCostEstimateNotice";
import {
  proofScopeToRequiredCapabilities,
  type QuickReviewProofScopeId,
} from "@/components/usability/QuickReviewProofScopeField";
import { readActiveTenantContext } from "@/lib/active-tenant-context-display";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/vocabulary/core-pilot-path-vocabulary";
import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import {
  REVIEW_CREATION_PROGRESS_TIMEOUT_MS,
  useReviewCreationProgress,
} from "@/hooks/use-review-creation-progress";
import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture/architecture-request-limits";
import {
  mergeScopeBulletsIntoBrief,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { deriveEvidencePresenceFromFileNames } from "@/lib/evidence-gap-forecast";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_PREPARING_LABEL,
} from "@/lib/review-start-progress-copy";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import {
  buildEvidenceBackedIntakeBrief,
  describeFirstPilotIntakeGap,
  FIRST_PILOT_MIN_BRIEF_CHARS,
  formatFirstPilotIntakeWriteDestination,
  isFirstPilotIntakeReady,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";
import { PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { uploadWizardPendingDocumentEvidence } from "@/lib/wizard-pending-evidence-upload";
import { projectUniversalIntakeAnswersOntoCreateRunPayload } from "@/lib/universal-intake-answer-projection";
import { buildIntakeTransparencyTrail } from "@/lib/universal-intake-must-completeness";

import { WIZARD_SESSION_IDS, wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

import { WizardEvidenceUploadZone } from "./QuickReviewWizardDeferredPanels";

const V1_DEFAULT_CLOUD_PROVIDER: CreateArchitectureRunRequestPayload["cloudProvider"] = "None";

/**
 * First-run intake sends every proof dimension. The former operator-facing selector was removed because
 * no pipeline stage branches on these capability tokens, so narrowing them changed nothing a buyer could see.
 */
const DEFAULT_PROOF_SCOPE: QuickReviewProofScopeId[] = ["cost", "compliance", "topology"];
const FIRST_PILOT_REQUIRED_CAPABILITIES: string[] = proofScopeToRequiredCapabilities(DEFAULT_PROOF_SCOPE);

/** Create + multipart evidence upload can exceed the default soft-fail budget on slow links. */
const FIRST_PILOT_WITH_UPLOAD_TIMEOUT_MS =
  REVIEW_CREATION_PROGRESS_TIMEOUT_MS + PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS;

type FirstPilotIntakeSessionState = {
  readonly runTitle: string;
  readonly briefText: string;
  readonly focusedPilotModeEnabled: boolean;
  readonly l0Answers: Readonly<Record<string, string>>;
  readonly l0SkippedQuestionKeys: readonly string[];
};

export const FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE =
  "Add a review title and either attach architecture evidence or provide enough context in the description.";

type IntakeFieldLabelProps = {
  readonly htmlFor: string;
  readonly label: string;
  readonly required: boolean;
};

function IntakeFieldLabel(props: IntakeFieldLabelProps): React.JSX.Element {
  return (
    <Label htmlFor={props.htmlFor} className="font-semibold text-neutral-900 dark:text-neutral-100">
      {props.label}
      <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.required ? " (required)" : " (required without evidence)"}
      </span>
    </Label>
  );
}

function buildFirstPilotPayload(
  title: string,
  brief: string,
  requiredCapabilities: string[],
  focusedPilotModeEnabled: boolean,
): CreateArchitectureRunRequestPayload {
  return {
    requestId: crypto.randomUUID().replace(/-/g, ""),
    description: brief.trim(),
    systemName: normalizeFirstPilotReviewTitle(title),
    environment: "staging",
    cloudProvider: V1_DEFAULT_CLOUD_PROVIDER,
    constraints: [],
    requiredCapabilities,
    assumptions: [],
    policyReferences: applyFocusedPilotModePolicyReferences([], focusedPilotModeEnabled),
  };
}

export type FirstPilotIntakeWizardProps = {
  readonly onRunCreatedNavigate?: (runId: string) => void;
};

/** Single-screen first-pilot intake: review title, evidence upload, optional brief, advanced settings collapsed. */
export function FirstPilotIntakeWizard(props: FirstPilotIntakeWizardProps) {
  const { onRunCreatedNavigate } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const exampleTemplatePrefillAppliedRef = useRef(false);

  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).template,
    [searchParams],
  );

  const [runTitle, setRunTitle] = useState("");
  const [briefText, setBriefText] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [l0Answers, setL0Answers] = useState<Readonly<Record<string, string>>>({});
  const [l0SkippedQuestionKeys, setL0SkippedQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [clientValidationMessage, setClientValidationMessage] = useState<string | null>(null);
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

  /**
   * Readiness is judged on what the operator actually supplied. Passing {@link resolvedBrief} here would
   * always pass the minimum, because it synthesizes boilerplate long enough to clear the threshold on its own.
   */
  const intakeReadiness = {
    title: runTitle,
    brief: briefText,
    evidenceFileCount: evidenceFiles.length,
    l0Must: {
      answers: l0Answers,
      skippedQuestionKeys: l0SkippedQuestionKeys,
    },
  };

  const canStart =
    isFirstPilotIntakeReady(intakeReadiness) &&
    scopeGateOpen &&
    resolvedBrief.length <= ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH &&
    !creationProgress.isActive &&
    !blocksLlmExecution;

  const intakeGap = describeFirstPilotIntakeGap(intakeReadiness);

  const submitRun = async () => {
    if (!canStart) {
      setClientValidationMessage(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    if (resolvedBrief.length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH) {
      setClientValidationMessage(
        `Brief must not exceed ${ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`,
      );

      return;
    }

    setClientValidationMessage(null);

    const filesToUpload = [...evidenceFiles];
    creationProgress.begin({
      hasTemplate: exampleTemplate !== null,
      timeoutMs: filesToUpload.length > 0 ? FIRST_PILOT_WITH_UPLOAD_TIMEOUT_MS : undefined,
    });

    try {
      const briefWithScope = mergeScopeBulletsIntoBrief(scopeBullets, resolvedBrief);
      const intakeTransparencyTrail = buildIntakeTransparencyTrail(l0SkippedQuestionKeys);
      const basePayload = buildFirstPilotPayload(
        runTitle,
        briefWithScope,
        FIRST_PILOT_REQUIRED_CAPABILITIES,
        focusedPilotModeEnabled,
      );
      const body = projectUniversalIntakeAnswersOntoCreateRunPayload(
        basePayload,
        l0Answers,
        l0SkippedQuestionKeys,
        intakeTransparencyTrail,
      );
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (id === null) {
        creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);

        return;
      }

      // Registered before the upload step: analysis is already running server-side, so an upload
      // failure that keeps the reader on this page must not hide the work from the shell.
      trackReviewPipelineInFlight(id);

      if (filesToUpload.length > 0) {
        const uploadResult = await uploadWizardPendingDocumentEvidence(id, filesToUpload);

        if (!uploadResult.ok) {
          creationProgress.fail(uploadResult.message);

          return;
        }

        setEvidenceFiles([]);
      }

      recordFirstTenantFunnelEvent("first_run_started");
      creationProgress.markPreparingQuestions();
      creationProgress.markOpeningReview();
      creationProgress.succeed();
      wizardSession.clearSession();

      if (onRunCreatedNavigate !== undefined) {
        onRunCreatedNavigate(id);
        creationProgress.reset();

        return;
      }

      router.push(buildReviewGenerationRedirect(id, "quick-review"));
    } catch (error) {
      const message =
        isApiRequestError(error) && error.message.trim().length > 0
          ? error.message
          : REVIEW_START_CREATION_FAILED_MESSAGE;
      creationProgress.fail(message);
    }
  };

  return (
    <div className="space-y-5 pb-24" data-testid="first-pilot-intake-wizard">
      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}
      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}
      {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}

      <section className="space-y-4" data-testid="first-pilot-intake-panel">
        <div className="space-y-1">
          <h2
            className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {CREATE_REVIEW_PACKAGE_HEADING}
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <IntakeFieldLabel htmlFor="first-pilot-title" label="Review title" required />
            <Input
              id="first-pilot-title"
              value={runTitle}
              onChange={(event) => {
                setRunTitle(event.target.value);
                setClientValidationMessage(null);
              }}
              placeholder="Example: Retail API modernization review"
              autoComplete="off"
              aria-required
              data-testid="first-pilot-title"
            />
          </div>

          <WizardEvidenceUploadZone
            labelId="first-pilot-evidence"
            title="Attach architecture evidence"
            description="Diagram, PDF export, or architecture document. Accepted: PDF, DOCX, Markdown, text, JSON, YAML, images."
            attachmentSummarySuffix="or add architecture context below"
            onFilesSelected={(files) => {
              setEvidenceFiles(files);
              setClientValidationMessage(null);
            }}
          />

          <div className="space-y-2">
            <IntakeFieldLabel htmlFor="first-pilot-brief" label="Architecture context" required={false} />
            <Textarea
              id="first-pilot-brief"
              value={briefText}
              onChange={(event) => {
                setBriefText(event.target.value);
                setClientValidationMessage(null);
              }}
              className={cn("min-h-[100px]", OPERATOR_TYPOGRAPHY.body)}
              placeholder="Add as much useful context as you can: goals, constraints, risks, business drivers, integrations, data flows, security concerns, known tradeoffs, and what you want ArchLucid to focus on."
              aria-describedby="first-pilot-brief-hint"
              data-testid="first-pilot-brief"
            />
            <p
              id="first-pilot-brief-hint"
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              {briefText.trim().length}/{FIRST_PILOT_MIN_BRIEF_CHARS} characters minimum if you are not attaching
              evidence.
            </p>
          </div>

          <EvidenceGapForecastPanel presence={evidencePresence} />

          <QuickStartL0MustQuestionsPanel
            answers={l0Answers}
            skippedQuestionKeys={l0SkippedQuestionKeys}
            busy={creationProgress.isActive || blocksLlmExecution}
            onAnswersChange={setL0Answers}
            onSkippedQuestionKeysChange={setL0SkippedQuestionKeys}
          />

          <ArchitectureScopeUnderstandingCheckPanel
            input={scopeUnderstandingInput}
            contextSourceLabel="Architecture context above"
            disabled={creationProgress.isActive || blocksLlmExecution}
            onBulletsChange={setScopeBullets}
            onGateChange={setScopeGateOpen}
          />

          <PreExecuteCostEstimateNotice
            testId="first-pilot-pre-execute-cost"
            remainingBudgetUsd={llmBudgetStatus?.remainingBudgetUsd ?? null}
            monthlyBudgetMonitoringActive={llmBudgetStatus?.monthlyBudgetMonitoringActive ?? null}
            useBudgetGate={false}
          />

          <CollapsibleSection
            title="Review standards selection"
            summaryLine={CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeAdvancedNote}
            sectionTestId="first-pilot-standards-selection"
          >
            <PilotModePolicyPackToggle
              presentation="choice"
              enabled={focusedPilotModeEnabled}
              onEnabledChange={setFocusedPilotModeEnabled}
            />
          </CollapsibleSection>

          <ReviewPathTimeEstimateBanner pathId="quick-review" />

          {creationProgress.showStagedPanel && creationProgress.activeStageId !== null ? (
            <ReviewStartStagedProgress
              stages={creationProgress.stages}
              activeStageId={creationProgress.activeStageId}
              headline={REVIEW_START_PREPARING_LABEL}
              detail={creationProgress.waitCopy?.detail ?? null}
              testId="first-pilot-review-start-progress"
            />
          ) : null}

          {clientValidationMessage !== null ? (
            <ReviewStartInlineError message={clientValidationMessage} testId="first-pilot-validation-error" />
          ) : null}

          {creationProgress.outcome?.kind === "failed" ? (
            <ReviewStartInlineError
              message={creationProgress.outcome.message}
              testId="first-pilot-submit-error"
            />
          ) : null}

          {creationProgress.outcome?.kind === "unresolved" ? (
            <ReviewStartUnresolvedNotice
              onRecheck={() => {
                void submitRun();
              }}
              isRechecking={creationProgress.isActive}
              testId="first-pilot-unresolved-notice"
            />
          ) : null}

          {intakeGap !== null ? (
            <p
              id="first-pilot-readiness"
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="first-pilot-readiness"
              role="status"
            >
              {intakeGap}
            </p>
          ) : null}

          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="first-pilot-write-destination"
          >
            {writeDestination}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <WizardSessionSaveStatus
              saveState={wizardSession.saveState}
              lastSavedUtc={wizardSession.lastSavedUtc}
            />
            <ReviewStartLoadingButton
              type="button"
              variant="primary"
              disabled={creationProgress.isActive || blocksLlmExecution}
              onClick={() => {
                void submitRun();
              }}
              data-testid="first-pilot-start"
              idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
              loadingLabel={creationProgress.loadingLabel}
              isLoading={creationProgress.isActive}
              aria-describedby={intakeGap !== null ? "first-pilot-readiness" : undefined}
            />
            <NewReviewSampleEscapeLink presentation="inline" />
          </div>
        </div>
      </section>

      <FocusedPilotPolicyPackAppliedCallout />
    </div>
  );
}
