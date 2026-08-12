"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture/architecture-request-limits";
import { QUICK_REVIEW_SAMPLE_BRIEF_CAPTION } from "@/lib/buyer/buyer-polish-copy";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";

import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import {
  QuickReviewProofScopeField,
  proofScopeToRequiredCapabilities,
  type QuickReviewProofScopeId,
} from "@/components/usability/QuickReviewProofScopeField";
import type { CtoDemoReviewExecutionMode } from "@/components/cto-demo/CtoDemoReviewModeCallout";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { REVIEW_START_CREATION_FAILED_MESSAGE, REVIEW_START_DEMO_MODE_SUBMIT_MESSAGE, REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE, REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import {
  persistQuickReviewWizardPreferences,
  readQuickReviewWizardPreferences,
} from "@/lib/usability/quick-review-wizard-preferences";
import {
  CONTOSO_RETAIL_SAMPLE_BRIEF,
  defaultQuickReviewSampleBriefId,
  findQuickReviewSampleBrief,
  QUICK_REVIEW_SAMPLE_BRIEFS,
} from "@/lib/quick-review-sample-briefs";

import {
  CtoDemoFastCreatePanel,
  CtoDemoReviewModeCallout,
  QuickReviewAdvancedConfigAccordion,
  WizardEvidenceUploadZone,
  WizardPackagePreview,
} from "./QuickReviewWizardDeferredPanels";

export { CONTOSO_RETAIL_SAMPLE_BRIEF };

const MIN_BRIEF_CHARS = 100;

const QUICK_REVIEW_STEPS = [
  { label: "Paste your architecture brief", description: "Free text — we send it as the architecture review description." },
  { label: "Review scope", description: "Confirm workspace scope and optional title." },
  { label: "Confirm and start architecture review", description: "Create the request and open pipeline progress." },
] as const;

/** V1 evidence-first default; Azure is set when Azure extractor evidence is attached. */
const V1_DEFAULT_CLOUD_PROVIDER: CreateArchitectureRunRequestPayload["cloudProvider"] = "None";

function buildQuickReviewPayload(
  brief: string,
  titleTrimmed: string,
  requiredCapabilities: string[],
  focusedPilotModeEnabled: boolean,
): CreateArchitectureRunRequestPayload {
  const systemName = titleTrimmed.trim().length >= 2 ? titleTrimmed.trim() : "Architecture review";

  return {
    requestId: crypto.randomUUID().replace(/-/g, ""),
    description: brief.trim(),
    systemName,
    environment: "staging",
    cloudProvider: V1_DEFAULT_CLOUD_PROVIDER,
    constraints: [],
    requiredCapabilities,
    assumptions: [],
    policyReferences: applyFocusedPilotModePolicyReferences([], focusedPilotModeEnabled),
  };
}

const DEFAULT_PROOF_SCOPE: QuickReviewProofScopeId[] = ["cost", "compliance", "topology"];

function readInitialWizardState(): {
  proofScope: QuickReviewProofScopeId[];
  executionMode: CtoDemoReviewExecutionMode;
  advancedConfigExpanded: boolean;
} {
  const stored = readQuickReviewWizardPreferences();

  if (stored === null) {
    return {
      proofScope: DEFAULT_PROOF_SCOPE,
      executionMode: "simulator",
      advancedConfigExpanded: false,
    };
  }

  return {
    proofScope: stored.proofScope,
    executionMode: stored.executionMode,
    advancedConfigExpanded: stored.advancedConfigExpanded,
  };
}

export type QuickReviewWizardProps = {
  /** Test hook: invoked instead of `router.push` after a run id is returned. */
  onRunCreatedNavigate?: (runId: string) => void;
};

/**
 * Three-step “paste your brief” path: brief → scope/title → confirm. Posts the same body shape as the full wizard.
 */
export function QuickReviewWizard(props: QuickReviewWizardProps) {
  const { onRunCreatedNavigate } = props;
  const initialWizardState = readInitialWizardState();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const exampleTemplatePrefillAppliedRef = useRef(false);

  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).template,
    [searchParams],
  );

  const [step, setStep] = useState(0);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [briefText, setBriefText] = useState("");
  const [activeSampleBriefId, setActiveSampleBriefId] = useState<string | null>(null);
  const [runTitle, setRunTitle] = useState("");
  const [scope, setScope] = useState<Record<string, string> | null>(null);
  const creationProgress = useReviewCreationProgress();
  const [executionMode, setExecutionMode] = useState<CtoDemoReviewExecutionMode>(initialWizardState.executionMode);
  const [evidenceAttached, setEvidenceAttached] = useState(false);
  const [proofScope, setProofScope] = useState<QuickReviewProofScopeId[]>(initialWizardState.proofScope);
  const [advancedConfigExpanded, setAdvancedConfigExpanded] = useState(initialWizardState.advancedConfigExpanded);
  const [clientValidationMessage, setClientValidationMessage] = useState<string | null>(null);

  const briefOk = briefText.trim().length >= MIN_BRIEF_CHARS && briefText.trim().length <= ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH;
  const showDemoModeCallout = isCtoDemoPackEnv() || isBuyerPolishedOperatorShellEnv() || readBuyerCtoDemoTourActive();

  const persistWizardPreferences = useCallback(() => {
    persistQuickReviewWizardPreferences({
      proofScope,
      executionMode,
      advancedConfigExpanded,
    });
  }, [advancedConfigExpanded, executionMode, proofScope]);

  useEffect(() => {
    persistWizardPreferences();
  }, [persistWizardPreferences]);

  useEffect(() => {
    if (step !== 1) {
      return;
    }

    setScope(getEffectiveBrowserProxyScopeHeaders());
  }, [step]);

  useEffect(() => {
    setClientValidationMessage(null);
  }, [step]);

  const defaultBriefAppliedRef = useRef(false);

  useEffect(() => {
    if (exampleTemplatePrefillAppliedRef.current) {
      return;
    }

    if (exampleTemplate !== null) {
      exampleTemplatePrefillAppliedRef.current = true;
      setBriefText(exampleTemplate.briefText);
      setRunTitle(exampleTemplate.title);
      setActiveSampleBriefId(exampleTemplate.quickReviewSampleBriefId ?? null);

      return;
    }

    if (defaultBriefAppliedRef.current) {
      return;
    }

    defaultBriefAppliedRef.current = true;
    const demoMode = isCtoDemoPackEnv() || isBuyerPolishedOperatorShellEnv();
    const tourActive = readBuyerCtoDemoTourActive();
    const defaultId = defaultQuickReviewSampleBriefId(demoMode, tourActive);
    const sample = findQuickReviewSampleBrief(defaultId);

    if (sample === null) {
      return;
    }

    setBriefText(sample.brief);
    setActiveSampleBriefId(sample.id);
  }, [exampleTemplate]);

  const scopeTenant = scope?.["x-tenant-id"] ?? "—";
  const scopeWorkspace = scope?.["x-workspace-id"] ?? "—";
  const scopeProject = scope?.["x-project-id"] ?? "—";

  const displaySystemName = useMemo(() => {
    const t = runTitle.trim();

    return t.length >= 2 ? t : "Architecture review";
  }, [runTitle]);

  const goNext = () => {
    if (step === 0 && briefText.trim().length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH) {
      setClientValidationMessage(
        `Brief must not exceed ${ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`,
      );

      return;
    }

    if (step === 0 && !briefOk) {
      setClientValidationMessage(`Brief must be at least ${MIN_BRIEF_CHARS} characters.`);

      return;
    }

    setClientValidationMessage(null);
    setStep((s) => Math.min(QUICK_REVIEW_STEPS.length - 1, s + 1));
  };

  const applySampleBrief = (briefId: string) => {
    const sample = findQuickReviewSampleBrief(briefId);

    if (sample === null) {
      return;
    }

    setBriefText(sample.brief);
    setActiveSampleBriefId(sample.id);
  };

  const useSampleBrief = () => {
    applySampleBrief("retail");
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const submitRun = async () => {
    if (briefText.trim().length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH) {
      setClientValidationMessage(
        `Brief must not exceed ${ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`,
      );

      return;
    }

    if (!briefOk) {
      setClientValidationMessage(`Brief must be at least ${MIN_BRIEF_CHARS} characters.`);

      return;
    }

    if (blocksLlmExecution) {
      setClientValidationMessage(REVIEW_START_LLM_BUDGET_EXCEEDED_MESSAGE);

      return;
    }

    setClientValidationMessage(null);
    creationProgress.begin({ hasTemplate: exampleTemplate !== null });

    try {
      const body = buildQuickReviewPayload(
        briefText,
        runTitle.trim(),
        proofScopeToRequiredCapabilities(proofScope),
        focusedPilotModeEnabled,
      );
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (!id) {
        creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);

        return;
      }

      recordFirstTenantFunnelEvent("first_run_started");
      creationProgress.markPreparingQuestions();
      creationProgress.markOpeningReview();

      // Disarm the watchdog now that the server owns the work; a slow client navigation must not
      // be reported as a create problem.
      creationProgress.succeed();

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

  const isStartingReview = creationProgress.isActive;

  return (
    <OperatorPageContainer variant="workflow" className="grid gap-4 pb-36 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
      <div className="space-y-4">
      {isCtoDemoPackEnv() ? <CtoDemoFastCreatePanel /> : null}
      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}
      {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}
      <div className="space-y-1" data-testid="quick-review-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
          Quick review — step {step + 1} of {QUICK_REVIEW_STEPS.length}: {QUICK_REVIEW_STEPS[step].label}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{QUICK_REVIEW_STEPS[step].description}</p>
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Paste your architecture brief</CardTitle>
            <CardDescription>
              Include goals, constraints, and context so the pipeline has enough to work with. Minimum {MIN_BRIEF_CHARS}{" "}
              characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="quick-review-brief">Architecture brief</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sample brief verticals">
                {QUICK_REVIEW_SAMPLE_BRIEFS.map((sample) => (
                  <Button
                    key={sample.id}
                    type="button"
                    variant={activeSampleBriefId === sample.id ? "default" : "outline"}
                    size="sm"
                    data-testid={`quick-review-vertical-${sample.id}`}
                    onClick={() => {
                      applySampleBrief(sample.id);
                    }}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
              <Textarea
                id="quick-review-brief"
                value={briefText}
                onChange={(e) => {
                  setBriefText(e.target.value);
                  setActiveSampleBriefId(null);
                  setClientValidationMessage(null);
                }}
                className={cn("min-h-[220px] font-mono", OPERATOR_TYPOGRAPHY.body)}
                placeholder="Example: Document the target architecture for a customer-facing retail API — containerized services behind an API gateway, relational store for orders, Redis cache, PCI-scoped segregation for payment-adjacent flows, 99.9% availability during peak, EU data residency for profiles, and a phased cutover from the current on-prem monolith…"
                aria-describedby="quick-review-brief-hint"
                autoComplete="off"
              />
              <p id="quick-review-brief-hint" className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
                {briefText.trim().length}/{MIN_BRIEF_CHARS} characters minimum ({ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} max). Paste an executive summary or detailed
                brief — it becomes the review description sent to the API.
                {activeSampleBriefId !== null ? (
                  <span className={cn("mt-1 block", OPERATOR_TYPOGRAPHY.helper)}>
                    {QUICK_REVIEW_SAMPLE_BRIEF_CAPTION}
                  </span>
                ) : null}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={useSampleBrief} data-testid="quick-review-sample-brief">
              Use sample brief (Claims Intake showcase)
            </Button>
            <WizardEvidenceUploadZone
              onFilesSelected={(files) => {
                if (files.length > 0) {
                  setEvidenceAttached(true);
                }
              }}
            />
            <QuickReviewProofScopeField
              selected={proofScope}
              onChange={(next) => {
                setProofScope(next);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Review scope</CardTitle>
            <CardDescription>Confirm a short title; workspace headers are optional under Advanced configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-review-title">Review title (optional)</Label>
              <Input
                id="quick-review-title"
                value={runTitle}
                onChange={(e) => {
                  setRunTitle(e.target.value);
                }}
                placeholder="Short name for this review (maps to system name)"
                autoComplete="off"
              />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                If empty, the review uses “{displaySystemName}” as the system name.
              </p>
            </div>
            <PilotModePolicyPackToggle
              enabled={focusedPilotModeEnabled}
              onEnabledChange={setFocusedPilotModeEnabled}
            />
            <QuickReviewAdvancedConfigAccordion
              open={advancedConfigExpanded}
              onOpenChange={setAdvancedConfigExpanded}
            >
              <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400">Tenant</dt>
                  <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeTenant}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400">Workspace</dt>
                  <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeWorkspace}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400">Project</dt>
                  <dd className="m-0 font-mono text-neutral-900 dark:text-neutral-100">{scopeProject}</dd>
                </div>
              </dl>
            </QuickReviewAdvancedConfigAccordion>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Confirm and start architecture review</CardTitle>
            <CardDescription>This starts a new architecture review with your pasted brief.</CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
            <ReviewPathTimeEstimateBanner pathId="quick-review" />
            {showDemoModeCallout ? (
              <QuickReviewAdvancedConfigAccordion
              open={advancedConfigExpanded}
              onOpenChange={setAdvancedConfigExpanded}
            >
                <CtoDemoReviewModeCallout mode={executionMode} onModeChange={setExecutionMode} />
              </QuickReviewAdvancedConfigAccordion>
            ) : null}
            <p className="m-0">
              <strong>System name:</strong> {displaySystemName}
            </p>
            <p className="m-0">
              <strong>Brief length:</strong> {briefText.trim().length} characters
            </p>
            <p className="m-0 line-clamp-4 text-neutral-600 dark:text-neutral-400">{briefText.trim()}</p>
            {creationProgress.showStagedPanel && creationProgress.activeStageId !== null ? (
              <ReviewStartStagedProgress
                stages={creationProgress.stages}
                activeStageId={creationProgress.activeStageId}
                headline={REVIEW_START_PREPARING_LABEL}
                detail={creationProgress.waitCopy?.detail ?? null}
                testId="quick-review-start-progress"
              />
            ) : null}
            {creationProgress.outcome?.kind === "failed" ? (
              <ReviewStartInlineError
                message={creationProgress.outcome.message}
                testId="quick-review-submit-error"
              />
            ) : null}
            {creationProgress.outcome?.kind === "unresolved" ? (
              <ReviewStartUnresolvedNotice
                onRecheck={() => {
                  void submitRun();
                }}
                isRechecking={creationProgress.isActive}
                testId="quick-review-submit-unresolved"
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {clientValidationMessage !== null ? (
          <ReviewStartInlineError
            message={clientValidationMessage}
            testId="quick-review-validation-error"
            className="w-full"
          />
        ) : null}
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} disabled={isStartingReview}>
            Back
          </Button>
        ) : null}
        {step < 2 ? (
          <Button type="button" onClick={goNext} disabled={isStartingReview || (step === 0 && !briefOk)}>
            Next
          </Button>
        ) : (
          <ReviewStartLoadingButton
            type="button"
            onClick={() => {
              if (executionMode === "simulator" && showDemoModeCallout) {
                setClientValidationMessage(REVIEW_START_DEMO_MODE_SUBMIT_MESSAGE);

                return;
              }

              void submitRun();
            }}
            disabled={blocksLlmExecution}
            data-testid="quick-review-start"
            idleLabel="Start Architecture Review"
            loadingLabel={creationProgress.loadingLabel}
            isLoading={isStartingReview}
          />
        )}
      </div>
      </div>

      <aside
        className="hidden lg:block"
        data-testid="quick-review-wizard-side-rail"
        data-operator-side-rail-kind="toc-wizard"
      >
        <WizardPackagePreview systemName={displaySystemName} hasEvidence={evidenceAttached} />
      </aside>
    </OperatorPageContainer>
  );
}
