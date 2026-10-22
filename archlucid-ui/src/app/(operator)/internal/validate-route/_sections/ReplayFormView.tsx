"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { INTERNAL_REPLAY_PATH, replayScopedHref } from "@/lib/internal-ops-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ReplayEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ReplaySelectedPackageSummary } from "@/components/replay/ReplaySelectedPackageSummary";
import { ReplayValidationHistorySection } from "@/components/replay/ReplayValidationHistorySection";
import { ReplayValidationImpactSummary } from "@/components/replay/ReplayValidationImpactSummary";
import { ReplayValidationModeSelector } from "@/components/replay/ReplayValidationModeSelector";
import { ReplayValidationResultPanel } from "@/components/replay/ReplayValidationResultPanel";
import { ReviewPackageValidationPicker } from "@/components/replay/ReviewPackageValidationPicker";
import { OperatorLoadingNotice, OperatorMalformedCallout, OperatorTryNext } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { ValidateCompareVocabularyRail } from "@/components/ValidateCompareVocabularyRail";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REPLAY_MODIFY_CONFIRMATION_LABEL,
  REPLAY_PAGE_INTRO,
} from "@/lib/replay-validation-copy";
import {
  resolveReplayValidationEmphasizedStepId,
  resolveReplayValidationSteps,
} from "@/lib/replay-validation-checklist";
import { replayValidationActionLabel, replayValidationModeDefinition } from "@/lib/replay-validation-workflow";

import { ReplayNextReviewFooterClient } from "./ReplayNextReviewFooterClient";
import { ReplayPickReviewBeforeValidatingStrip } from "./ReplayPickReviewBeforeValidatingStrip";
import type { ReplayFormViewModel } from "./replay-form-view-model";

type Props = {
  readonly model: ReplayFormViewModel;
};

export function ReplayFormView(props: Props) {
  const m = props.model;
  const scopedRunId = m.runIdTrimmed;
  const scopedRunFilterActive = scopedRunId.length > 0;
  const modeDefinition = replayValidationModeDefinition(m.mode);
  const lastValidationOutcome = scopedRunId.length > 0 ? m.lastValidationByRunId[scopedRunId] ?? null : null;
  const actionDisabled = m.loading || m.actionDisabledReason !== null;
  const prerequisiteReason: WhyDisabledCtaReason | null =
    m.actionDisabledReason !== null && m.actionDisabledReason.trim().length > 0
      ? {
          kind: "prerequisite",
          message: m.actionDisabledReason,
        }
      : null;
  const replayDisabledReason = firstWhyDisabledCtaReason([
    m.loading ? whyDisabledBusy("Validation") : null,
    prerequisiteReason,
  ]);
  const validationComplete = m.result !== null || m.historyEntries.length > 0;
  const replaySteps = resolveReplayValidationSteps({
    reviewPicked: scopedRunFilterActive,
    modeConfigured: scopedRunFilterActive,
    validationComplete,
  });
  const replayEmphasizedStepId = resolveReplayValidationEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    modeConfigured: scopedRunFilterActive,
    validationComplete,
  });
  const clearScopeHref = replayScopedHref(null);

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="replay-validation-workspace">
      <OperatorPageHeader navHref={INTERNAL_REPLAY_PATH} title="Validate review" helpKey="replay-run" actions={<PageContextualHelpButton />} />
      <ReplayEvidenceOrientationStrip />
      <ValidateCompareVocabularyRail currentSurfaceId="validate-replay" />
      <p className={cn("m-0 max-w-4xl leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{REPLAY_PAGE_INTRO}</p>

      {!scopedRunFilterActive ? (
        <ReplayPickReviewBeforeValidatingStrip selectedReviewId={m.runId} onSelectReview={m.onPickReview} />
      ) : (
        <>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="replay-run-scope-banner"
          >
            {"Validating review "}
            <span className="font-mono text-al-text-primary">{scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={clearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
            >
              Open review
            </Link>
          </p>
          <IntegrationConnectChecklist
            title="Validation checklist"
            steps={replaySteps}
            emphasizedStepId={replayEmphasizedStepId}
            testIdPrefix="replay-validation"
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <ReviewPackageValidationPicker
                value={m.runId}
                onChange={m.setRunId}
                onRunPicked={(summary) => m.setSelectedRun(summary)}
                lastValidationByRunId={m.lastValidationByRunId}
                disabled={m.loading}
                inputId="replay-run-id"
              />

              <ReplayValidationModeSelector mode={m.mode} disabled={m.loading} onModeChange={m.setMode} />

              <ReplayValidationImpactSummary mode={m.mode} />

              {modeDefinition.requiresModifyConfirmation ? (
                <label className={cn("flex items-start gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  <input
                    type="checkbox"
                    checked={m.modifyConfirmed}
                    disabled={m.loading}
                    onChange={(event) => m.setModifyConfirmed(event.target.checked)}
                    data-testid="replay-modify-confirmation"
                  />
                  <span>{REPLAY_MODIFY_CONFIRMATION_LABEL}</span>
                </label>
              ) : null}

              <div className="space-y-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={actionDisabled}
                  aria-describedby={replayDisabledReason !== null ? "replay-action-disabled-reason" : undefined}
                  onClick={() => void m.onReplay()}
                  data-testid="replay-validation-primary-action"
                >
                  {replayValidationActionLabel(m.mode, m.loading)}
                </Button>
                <WhyDisabledCtaHint
                  reason={replayDisabledReason}
                  id="replay-action-disabled-reason"
                  testId="replay-action-disabled-reason"
                />
              </div>
            </div>

            <ReplaySelectedPackageSummary
              selectedRun={m.selectedRun}
              mode={m.mode}
              lastValidationOutcome={lastValidationOutcome}
            />
          </div>

          {m.loading && scopedRunId ? (
            <OperatorLoadingNotice>
              <strong>Validation in progress.</strong>
              <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                {modeDefinition.loadingActionLabel} Avoid navigating away until this completes.
              </p>
            </OperatorLoadingNotice>
          ) : null}

          {m.failure !== null ? (
            <>
              <OperatorApiProblem failure={m.failure} />
              <OperatorTryNext>
                Confirm the review exists, you have architect permissions, and the API is healthy. Retry with a lighter validation depth
                before running a full regeneration. Copy the correlation ID for support logs.
              </OperatorTryNext>
            </>
          ) : null}

          {m.malformedMessage ? (
            <>
              <OperatorMalformedCallout>
                <strong>Validation response was not usable.</strong>
                <p className="mt-2">{m.malformedMessage}</p>
              </OperatorMalformedCallout>
              <OperatorTryNext>
                Compare API and UI versions. If HTTP succeeded but validation JSON drifted, open a defect with the product version and the
                correlation ID from any paired failing request.
              </OperatorTryNext>
            </>
          ) : null}

          {m.result ? (
            <ClientErrorBoundary title="Validation result failed to render">
              <ReplayValidationResultPanel result={m.result} />
            </ClientErrorBoundary>
          ) : null}

          <ReplayValidationHistorySection runId={scopedRunId} entries={m.historyEntries} />
          <ReplayNextReviewFooterClient runId={scopedRunId} />
        </>
      )}
    </OperatorPageContainer>
  );
}
