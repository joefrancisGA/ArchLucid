"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { AlertTuningCandidateCard } from "@/components/alerts/AlertTuningCandidateCard";
import { AlertTuningForm } from "@/components/alerts/AlertTuningForm";
import { AlertTuningPickReviewBeforeTuningStrip } from "@/components/alerts/AlertTuningPickReviewBeforeTuningStrip";
import { AlertTuningNextReviewFooterClient } from "@/components/alerts/AlertTuningNextReviewFooterClient";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingConfigureSectionSubline,
  alertTuningCurrentTuningHeadingOperator,
  alertTuningCurrentTuningHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import { useAlertTuningFormState } from "@/components/alerts/use-alert-tuning-form-state";

export function AlertTuningContent() {
  const canMutateEnterpriseShell = useOperateCapability();
  const model = useAlertTuningFormState();
  const {
    scopedRunId,
    scopedRunFilterActive,
    onPickReview,
    failure,
    result,
    recommendedLabel,
    recommend,
    ...formProps
  } = model;

  return (
    <div>
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {!scopedRunFilterActive ? (
        <AlertTuningPickReviewBeforeTuningStrip selectedReviewId="" onSelectReview={onPickReview} />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-tuning-run-scope-banner"
        >
          {"Tuning thresholds for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("test-alerts")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-10">
        <section className="min-w-0" aria-labelledby="alert-tuning-current-heading">
          <h3 id="alert-tuning-current-heading" className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {canMutateEnterpriseShell
              ? alertTuningCurrentTuningHeadingOperator
              : alertTuningCurrentTuningHeadingReader}
          </h3>
          {result ? (
            <>
              <h4 className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Summary</h4>
              <ul>
                {result.summaryNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>

              {result.recommendedCandidate ? (
                <section className="mb-6 mt-4">
                  <h4 className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Recommended candidate</h4>
                  <AlertTuningCandidateCard evaluation={result.recommendedCandidate} highlight />
                </section>
              ) : null}

              <h4 className={cn("mb-2 mt-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                All candidates (highest overall ranking first)
              </h4>
              <div className="grid gap-3">
                {[...result.candidates]
                  .sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore)
                  .map((c, i) => (
                    <AlertTuningCandidateCard
                      key={`${c.candidate.thresholdValue}-${i}`}
                      evaluation={c}
                      highlight={c.candidate.label === recommendedLabel}
                    />
                  ))}
              </div>
            </>
          ) : (
            <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              No tuning results yet. Run a recommendation below to compare candidate thresholds against recent reviews.
            </p>
          )}
        </section>

        {scopedRunFilterActive ? (
        <section className="min-w-0" aria-labelledby="alert-tuning-change-heading">
          <h3 id="alert-tuning-change-heading" className={cn("mb-2 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {alertToolingChangeConfigurationHeadingOperator}
          </h3>
          <p className={cn("mb-2.5 mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {alertToolingConfigureSectionSubline}
          </p>
          <AlertTuningForm
            {...formProps}
            onRecommend={recommend}
          />
        </section>
        ) : null}
      </div>

      {scopedRunFilterActive ? <AlertTuningNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
