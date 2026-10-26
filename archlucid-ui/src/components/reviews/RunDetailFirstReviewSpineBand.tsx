"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import {
  FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED,
  FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED,
  type FirstReviewSpineBandSummary,
} from "@/lib/reviews/first-review-spine-band";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import { cn } from "@/lib/utils";

export type RunDetailFirstReviewSpineBandProps = {
  readonly summary: FirstReviewSpineBandSummary;
  readonly className?: string;
  readonly unmappedFindingCount?: number;
  readonly runId?: string | null;
};

function gateOutcomeStatusKind(
  tone: FirstReviewSpineBandSummary["gateOutcomeTone"],
): "approved" | "needs-attention" | "blocked" {
  if (tone === "success") {
    return "approved";
  }

  if (tone === "danger") {
    return "blocked";
  }

  return "needs-attention";
}

/** Unified first-viewport spine: gate outcome, execution mode, classification counts, top finding. */
export function RunDetailFirstReviewSpineBand(props: RunDetailFirstReviewSpineBandProps): ReactElement {
  const { summary } = props;

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        props.className,
      )}
      data-testid="run-detail-first-review-spine-band"
      aria-label="First-review spine"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>First-review spine</p>
        <StatusTag
          kind={gateOutcomeStatusKind(summary.gateOutcomeTone)}
          label={`Gate: ${summary.gateOutcomeLabel}`}
          data-testid="run-detail-first-review-spine-gate"
        />
        {summary.executionModeLabel !== null ? (
          <StatusTag
            kind="neutral"
            label={
              summary.executionModeLabel === "Execution mode was not stored"
                ? summary.executionModeLabel
                : `${summary.executionModeLabel} execution`
            }
            data-testid="run-detail-first-review-spine-execution-mode"
          />
        ) : null}
      </div>

      {summary.gateOutcomeDetail !== null ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {summary.gateOutcomeDetail}
        </p>
      ) : null}

      <p
        className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-first-review-spine-classification"
      >
        {summary.classificationCountsStored
          ? `Decision-grade: ${summary.decisionGradeCount} · Checklist: ${summary.checklistCount}${
              summary.uncitedCount > 0 ? ` · Uncited: ${summary.uncitedCount}` : ""
            }${summary.evidenceReferenceCountNotStored ? " · Evidence reference count was not stored." : ""}`
          : FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED}
      </p>

      {summary.treatmentSummaryLine !== null ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-first-review-spine-treatment"
        >
          {summary.treatmentSummaryLine}
        </p>
      ) : null}

      <p
        className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-first-review-spine-disposition"
      >
        {summary.dispositionCountsStored
          ? `Dispositions recorded: ${summary.recordedDispositionCount}${
              summary.openDecisionGradeDispositionCount > 0
                ? ` · Open decision-grade: ${summary.openDecisionGradeDispositionCount}`
                : ""
            }`
          : FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED}
      </p>

      {summary.showDispositionNextAction ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-first-review-spine-disposition-next-action"
        >
          Record dispositions on open decision-grade findings before sponsor send.{" "}
          {props.runId !== null && props.runId !== undefined && props.runId.trim().length > 0 ? (
            <Link
              href={`/architecture/reviews/${encodeURIComponent(props.runId.trim())}?reviewTab=findings`}
              className={OPERATOR_LINK.inline}
              data-testid="run-detail-first-review-spine-disposition-findings-link"
            >
              Open this review&apos;s findings
            </Link>
          ) : (
            <>Review id was not stored.</>
          )}
        </p>
      ) : null}

      {summary.showTopFindingRow ? (
        <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="run-detail-first-review-spine-top-finding">
          <span className="font-semibold">
            {summary.topFindingRankLabel ?? "Decision-grade finding:"}
          </span>{" "}
          {summary.topFindingSeverityLabel !== null
          && !summary.topFindingSeverityLabel.startsWith("Severity")
            ? `[${summary.topFindingSeverityLabel}] `
            : summary.topFindingSeverityLabel !== null
              ? `${summary.topFindingSeverityLabel} `
              : ""}
          {summary.topFindingTitle}
        </p>
      ) : null}

      {summary.semanticSupportLine !== null ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-first-review-spine-semantic-support"
        >
          {summary.semanticSupportLine}
        </p>
      ) : null}

      {summary.showLaneBHonesty ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-first-review-spine-lane-b-honesty"
        >
          {SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY}
        </p>
      ) : null}

      <PolicyPackInfluenceHonestyChip
        className="mt-2"
        unmappedFindingCount={props.unmappedFindingCount}
      />

      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={POLICY_PACK_DELTA_DEMO_HELP_PATH}
          className={OPERATOR_LINK.inline}
          data-testid="run-detail-first-review-spine-pack-delta-demo-link"
        >
          Policy-pack delta demo (sample runbook, not this review).
        </Link>
      </p>
    </section>
  );
}
