"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import type { FirstReviewSpineBandSummary } from "@/lib/reviews/first-review-spine-band";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import { cn } from "@/lib/utils";

export type RunDetailFirstReviewSpineBandProps = {
  readonly summary: FirstReviewSpineBandSummary;
  readonly className?: string;
  readonly unmappedFindingCount?: number;
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
            label={`${summary.executionModeLabel} execution`}
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
        Decision-grade: {summary.decisionGradeCount} · Checklist: {summary.checklistCount}
        {summary.uncitedCount > 0 ? ` · Uncited: ${summary.uncitedCount}` : ""}
      </p>

      {summary.topFindingTitle !== null ? (
        <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="run-detail-first-review-spine-top-finding">
          <span className="font-semibold">Top policy-mapped finding:</span>{" "}
          {summary.topFindingSeverityLabel !== null ? `[${summary.topFindingSeverityLabel}] ` : ""}
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
          See how a policy-pack change shifts findings
        </Link>
      </p>
    </section>
  );
}
