"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useMemo } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import {
  FIRST_REVIEW_SPINE_CLASSIFICATION_COUNTS_NOT_STORED,
  FIRST_REVIEW_SPINE_DISPOSITIONS_NOT_STORED,
  FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED,
  FIRST_REVIEW_SPINE_NO_OPEN_GATE_CLEAR_LINE,
  FIRST_REVIEW_SPINE_NO_OPEN_GATE_EVIDENCE_REF_NOT_STORED,
  resolveFirstReviewSpineOpenGateSectionId,
  resolveFirstReviewOpenGateReviewHref,
  resolveFirstReviewFindingsWorkspaceHref,
  type FirstReviewSpineBandSummary,
} from "@/lib/reviews/first-review-spine-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";
import { cn } from "@/lib/utils";

export type RunDetailFirstReviewSpineBandProps = {
  readonly summary: FirstReviewSpineBandSummary;
  readonly className?: string;
  readonly unmappedFindingCount?: number;
  readonly runId?: string | null;
  readonly isSample?: boolean | null;
  readonly manifestVersion?: string | null;
  readonly sampleSponsorParagraph?: string | null;
  readonly openGateNavigationInput?: {
    readonly findings: readonly QuickDecisionFinding[];
    readonly hasFindingsSnapshot: boolean;
    readonly reviewHasGoldenManifest: boolean;
  } | null;
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
  const openGateSectionId = resolveFirstReviewSpineOpenGateSectionId(summary.openGateReviewTab);
  const trimmedRunId = props.runId?.trim() ?? "";
  const openGateHref = useMemo((): string | null => {
    if (summary.openGateReviewTab === null || trimmedRunId.length === 0) {
      return null;
    }

    if (props.openGateNavigationInput !== null && props.openGateNavigationInput !== undefined) {
      return resolveFirstReviewOpenGateReviewHref({
        runId: trimmedRunId,
        findings: props.openGateNavigationInput.findings,
        hasFindingsSnapshot: props.openGateNavigationInput.hasFindingsSnapshot,
        reviewHasGoldenManifest: props.openGateNavigationInput.reviewHasGoldenManifest,
      });
    }

    return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?reviewTab=${summary.openGateReviewTab}`;
  }, [props.openGateNavigationInput, summary.openGateReviewTab, trimmedRunId]);

  const findingsWorkspaceHref = useMemo((): string | null => {
    if (trimmedRunId.length === 0) {
      return null;
    }

    if (props.openGateNavigationInput === null || props.openGateNavigationInput === undefined) {
      return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?reviewTab=findings`;
    }

    return resolveFirstReviewFindingsWorkspaceHref({
      runId: trimmedRunId,
      findings: props.openGateNavigationInput.findings,
      hasFindingsSnapshot: props.openGateNavigationInput.hasFindingsSnapshot,
    });
  }, [props.openGateNavigationInput, trimmedRunId]);

  const openGateLinkEnabled =
    openGateHref !== null
    && (props.openGateNavigationInput === null
      || props.openGateNavigationInput === undefined
      || props.openGateNavigationInput.hasFindingsSnapshot !== false);

  return (
    <section
      id={openGateSectionId ?? undefined}
      className={cn(
        "scroll-mt-24 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
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

      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-open-gate">
        {summary.openGateLabel === FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED ? (
          FIRST_REVIEW_SPINE_OPEN_GATE_NOT_STORED
        ) : summary.openGateLabel === null ? (
          summary.evidenceReferenceCountNotStored
            ? FIRST_REVIEW_SPINE_NO_OPEN_GATE_EVIDENCE_REF_NOT_STORED
            : FIRST_REVIEW_SPINE_NO_OPEN_GATE_CLEAR_LINE
        ) : (
          <>
            Open gate: {summary.openGateLabel}.{" "}
            {props.runId !== null && props.runId !== undefined && props.runId.trim().length > 0 ? (
              openGateLinkEnabled ? (
                <Link href={openGateHref ?? "#"} className={OPERATOR_LINK.inline}>
                  Open the gate
                </Link>
              ) : (
                "Findings snapshot was not stored — open gate link withheld."
              )
            ) : (
              "Review id was not stored."
            )}
          </>
        )}
      </p>

      {props.isSample === true ? (
        <div className="mt-2 space-y-1 rounded border border-border bg-muted/30 p-2" data-testid="sample-review-evidence">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Sample manifest: {props.manifestVersion?.trim() || "Committed manifest id was not stored."}
          </p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Sample sponsor paragraph: {props.sampleSponsorParagraph?.trim() || "Sample sponsor paragraph was not stored."}
          </p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Sample. Not a customer result.</p>
        </div>
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
            findingsWorkspaceHref !== null ? (
              <Link
                href={findingsWorkspaceHref}
                className={OPERATOR_LINK.inline}
                data-testid="run-detail-first-review-spine-disposition-findings-link"
              >
                Open this review&apos;s findings
              </Link>
            ) : (
              "Findings snapshot was not stored."
            )
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
