"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import { ReviewSubmitPhaseProgress, type ReviewSubmitPhaseId } from "@/components/usability/ReviewSubmitPhaseProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  QuickReviewProofScopeField,
  proofScopeToRequiredCapabilities,
  type QuickReviewProofScopeId,
} from "@/components/usability/QuickReviewProofScopeField";
import { FirstRunIntakeStepGuide } from "@/components/wizard/FirstRunIntakeStepGuide";
import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture-request-limits";
import { BUYER_NEW_REVIEW_TOAST_CATEGORY, BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/core-pilot-path-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import {
  buildEvidenceBackedIntakeBrief,
  isFirstPilotIntakeReady,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { reviewPathTimeEstimate } from "@/lib/review-path-time-estimates";
import { showError, showSuccess } from "@/lib/toast";

import { WizardEvidenceUploadZone } from "./QuickReviewWizardDeferredPanels";

const V1_DEFAULT_CLOUD_PROVIDER: CreateArchitectureRunRequestPayload["cloudProvider"] = "None";
const DEFAULT_PROOF_SCOPE: QuickReviewProofScopeId[] = ["cost", "compliance", "topology"];

export const FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE =
  "Add a review title and upload at least one architecture document, or fill in the description.";

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
  const [proofScope, setProofScope] = useState<QuickReviewProofScopeId[]>(DEFAULT_PROOF_SCOPE);
  const [focusedPilotModeEnabled, setFocusedPilotModeEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);
  const [submitPhase, setSubmitPhase] = useState<ReviewSubmitPhaseId>("mapping");

  useEffect(() => {
    if (!submitting) {
      return;
    }

    setSubmitPhase("mapping");
    const policyTimer = window.setTimeout(() => {
      setSubmitPhase("policy");
    }, 900);
    const findingsTimer = window.setTimeout(() => {
      setSubmitPhase("findings");
    }, 1800);

    return () => {
      window.clearTimeout(policyTimer);
      window.clearTimeout(findingsTimer);
    };
  }, [submitting]);

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

  const canStart =
    isFirstPilotIntakeReady({
      title: runTitle,
      brief: resolvedBrief,
      evidenceFileCount: evidenceFiles.length,
    }) &&
    resolvedBrief.length <= ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH &&
    !submitting &&
    !blocksLlmExecution;

  const titleReady = runTitle.trim().length >= 2;
  const evidenceReady = evidenceFiles.length > 0;

  const showToast = useCallback((kind: "ok" | "err", message: string) => {
    if (kind === "ok") {
      showSuccess(message);
    } else {
      showError(BUYER_NEW_REVIEW_TOAST_CATEGORY, message);
    }
  }, []);

  const submitRun = async () => {
    if (!canStart) {
      showToast("err", FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE);

      return;
    }

    if (resolvedBrief.length > ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH) {
      showToast("err", `Brief must not exceed ${ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH} characters.`);

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = buildFirstPilotPayload(
        runTitle,
        resolvedBrief,
        proofScopeToRequiredCapabilities(proofScope),
        focusedPilotModeEnabled,
      );
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (id === null) {
        showToast("err", "API returned no architecture review id.");

        return;
      }

      recordFirstTenantFunnelEvent("first_run_started");
      showToast("ok", `Architecture review ${id} created — starting analysis.`);

      if (onRunCreatedNavigate !== undefined) {
        onRunCreatedNavigate(id);

        return;
      }

      router.push(buildReviewGenerationRedirect(id, "quick-review"));
    } catch (error: unknown) {
      setSubmitError(error);

      if (!isApiRequestError(error)) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : "Request failed.";
        showToast("err", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24" data-testid="first-pilot-intake-wizard">
      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}
      {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}

      <div className="space-y-1" data-testid="first-pilot-intake-progress">
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Your first review package</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeLead}
        </p>
      </div>

      <FirstRunIntakeStepGuide titleReady={titleReady} evidenceReady={evidenceReady} />

      <FocusedPilotPolicyPackAppliedCallout />

      <Card>
        <CardHeader>
          <CardTitle>{CREATE_REVIEW_PACKAGE_HEADING}</CardTitle>
          <CardDescription>
            Start with a title and one architecture diagram. Architecture context is optional when a file is attached.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-pilot-title">Review title</Label>
            <Input
              id="first-pilot-title"
              value={runTitle}
              onChange={(event) => {
                setRunTitle(event.target.value);
              }}
              placeholder="Example: Retail API modernization review"
              autoComplete="off"
              data-testid="first-pilot-title"
            />
          </div>

          <WizardEvidenceUploadZone
            title="Upload one architecture diagram"
            description="Required for your first review — a diagram, PDF export, or architecture document. Additional files are optional."
            onFilesSelected={(files) => {
              setEvidenceFiles(files);
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="first-pilot-brief">Architecture context</Label>
            <Textarea
              id="first-pilot-brief"
              value={briefText}
              onChange={(event) => {
                setBriefText(event.target.value);
              }}
              className={cn("min-h-[100px]", OPERATOR_TYPOGRAPHY.body)}
              placeholder="Add as much useful context as you can: goals, constraints, risks, business drivers, integrations, data flows, security concerns, known tradeoffs, and what you want ArchLucid to focus on."
              data-testid="first-pilot-brief"
            />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              {evidenceFiles.length > 0
                ? `${evidenceFiles.length} file${evidenceFiles.length === 1 ? "" : "s"} attached — architecture context optional.`
                : "If you do not upload files, provide enough context for ArchLucid to understand what should be reviewed."}
            </p>
          </div>

          <AdvancedOptionsAccordion triggerLabel="Review scope (optional)">
            <div className="space-y-4">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
                {CORE_PILOT_PATH_STREAMLINED_LABELS.firstIntakeAdvancedNote}
              </p>
              <PilotModePolicyPackToggle
                enabled={focusedPilotModeEnabled}
                onEnabledChange={setFocusedPilotModeEnabled}
              />
              <QuickReviewProofScopeField
                selected={proofScope}
                onChange={(next) => {
                  setProofScope(next);
                }}
              />
            </div>
          </AdvancedOptionsAccordion>

          <ReviewPathTimeEstimateBanner pathId="quick-review" />

          {submitting ? (
            <ReviewSubmitPhaseProgress
              activePhase={submitPhase}
              minutesEstimate={`First package typically ready in ${reviewPathTimeEstimate("quick-review").minutesLow}–${reviewPathTimeEstimate("quick-review").minutesHigh} minutes`}
            />
          ) : null}

          {submitError !== null ? (
            <div data-testid="first-pilot-submit-error">
              {isApiRequestError(submitError) ? (
                <OperatorApiProblem
                  problem={submitError.problem}
                  fallbackMessage={submitError.message}
                  correlationId={submitError.correlationId}
                  httpStatus={submitError.httpStatus}
                  retryAfterSeconds={submitError.retryAfterSeconds}
                />
              ) : (
                <OperatorApiProblem
                  problem={null}
                  fallbackMessage={
                    submitError && typeof submitError === "object" && "message" in submitError
                      ? String((submitError as { message?: string }).message)
                      : "Request failed."
                  }
                />
              )}
            </div>
          ) : null}

          {!submitting ? (
            <Button
              type="button"
              variant="primary"
              disabled={!canStart}
              onClick={() => {
                void submitRun();
              }}
              data-testid="first-pilot-start"
            >
              {BUYER_START_ARCHITECTURE_REVIEW_CTA}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
