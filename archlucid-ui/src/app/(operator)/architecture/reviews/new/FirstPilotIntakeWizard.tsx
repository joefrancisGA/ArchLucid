"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewIntakeExampleTemplateCallout } from "@/components/review-intake/ReviewIntakeExampleTemplateCallout";
import { ReviewPathTimeEstimateBanner } from "@/components/ReviewPathTimeEstimateBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  proofScopeToRequiredCapabilities,
  type QuickReviewProofScopeId,
} from "@/components/usability/QuickReviewProofScopeField";
import { FocusedPilotPolicyPackAppliedCallout } from "@/components/wizard/FocusedPilotPolicyPackAppliedCallout";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import {
  REVIEW_CREATION_PROGRESS_TIMEOUT_MS,
  useReviewCreationProgress,
} from "@/hooks/use-review-creation-progress";
import { createArchitectureRun, type CreateArchitectureRunRequestPayload } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { ARCHITECTURE_REQUEST_DESCRIPTION_MAX_LENGTH } from "@/lib/architecture-request-limits";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_PREPARING_LABEL,
} from "@/lib/review-start-progress-copy";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD } from "@/lib/create-vs-review-intake-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import {
  buildEvidenceBackedIntakeBrief,
  describeFirstPilotIntakeGap,
  isFirstPilotIntakeReady,
  normalizeFirstPilotReviewTitle,
} from "@/lib/first-pilot-intake";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { uploadWizardPendingDocumentEvidence } from "@/lib/wizard-pending-evidence-upload";

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

export const FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE =
  "Add a review title and either attach architecture evidence or provide enough context in the description.";

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
  const [clientValidationMessage, setClientValidationMessage] = useState<string | null>(null);
  const creationProgress = useReviewCreationProgress();

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

  /**
   * Readiness is judged on what the operator actually supplied. Passing {@link resolvedBrief} here would
   * always pass the minimum, because it synthesizes boilerplate long enough to clear the threshold on its own.
   */
  const intakeReadiness = {
    title: runTitle,
    brief: briefText,
    evidenceFileCount: evidenceFiles.length,
  };

  const canStart =
    isFirstPilotIntakeReady(intakeReadiness) &&
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
      const body = buildFirstPilotPayload(
        runTitle,
        resolvedBrief,
        FIRST_PILOT_REQUIRED_CAPABILITIES,
        focusedPilotModeEnabled,
      );
      const res = await createArchitectureRun(body);
      const id = res.run?.runId ?? null;

      if (id === null) {
        creationProgress.fail(REVIEW_START_CREATION_FAILED_MESSAGE);

        return;
      }

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
      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}
      {exampleTemplate !== null ? <ReviewIntakeExampleTemplateCallout template={exampleTemplate} /> : null}

      <FocusedPilotPolicyPackAppliedCallout />

      <Card>
        <CardHeader>
          <CardTitle>{CREATE_REVIEW_PACKAGE_HEADING}</CardTitle>
          <CardDescription>{REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-pilot-title">Review title</Label>
            <Input
              id="first-pilot-title"
              value={runTitle}
              onChange={(event) => {
                setRunTitle(event.target.value);
                setClientValidationMessage(null);
              }}
              placeholder="Example: Retail API modernization review"
              autoComplete="off"
              data-testid="first-pilot-title"
            />
          </div>

          <WizardEvidenceUploadZone
            labelId="first-pilot-evidence"
            title="Attach evidence (optional)"
            description="Diagram, PDF export, or architecture document. Accepted: PDF, DOCX, Markdown, text, JSON, YAML, images."
            attachmentSummarySuffix="architecture context optional"
            onFilesSelected={(files) => {
              setEvidenceFiles(files);
              setClientValidationMessage(null);
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="first-pilot-brief">Architecture context</Label>
            <Textarea
              id="first-pilot-brief"
              value={briefText}
              onChange={(event) => {
                setBriefText(event.target.value);
                setClientValidationMessage(null);
              }}
              className={cn("min-h-[100px]", OPERATOR_TYPOGRAPHY.body)}
              placeholder="Add as much useful context as you can: goals, constraints, risks, business drivers, integrations, data flows, security concerns, known tradeoffs, and what you want ArchLucid to focus on."
              data-testid="first-pilot-brief"
            />
          </div>

          <AdvancedOptionsAccordion triggerLabel="Review scope (optional)">
            <PilotModePolicyPackToggle
              presentation="choice"
              enabled={focusedPilotModeEnabled}
              onEnabledChange={setFocusedPilotModeEnabled}
            />
          </AdvancedOptionsAccordion>

          <ReviewPathTimeEstimateBanner pathId="quick-review" />

          {creationProgress.showStagedPanel && creationProgress.activeStageId !== null ? (
            <ReviewStartStagedProgress
              stages={creationProgress.stages}
              activeStageId={creationProgress.activeStageId}
              headline={REVIEW_START_PREPARING_LABEL}
              testId="first-pilot-review-start-progress"
            />
          ) : null}

          {clientValidationMessage !== null ? (
            <ReviewStartInlineError message={clientValidationMessage} testId="first-pilot-validation-error" />
          ) : null}

          {creationProgress.error !== null ? (
            <ReviewStartInlineError message={creationProgress.error} testId="first-pilot-submit-error" />
          ) : null}

          {intakeGap !== null ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="first-pilot-readiness"
              role="status"
            >
              {intakeGap}
            </p>
          ) : null}

          <ReviewStartLoadingButton
            type="button"
            variant="primary"
            disabled={!canStart}
            onClick={() => {
              void submitRun();
            }}
            data-testid="first-pilot-start"
            idleLabel={BUYER_START_ARCHITECTURE_REVIEW_CTA}
            loadingLabel={creationProgress.loadingLabel}
            isLoading={creationProgress.isActive}
          />
        </CardContent>
      </Card>
    </div>
  );
}
