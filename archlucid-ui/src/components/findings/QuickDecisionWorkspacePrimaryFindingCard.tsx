"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ReactElement } from "react";

import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { QuickDecisionFindingRationale } from "@/components/findings/QuickDecisionFindingRationale";
import { QuickDecisionWorkspaceFindingSupportingDetails } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import type { QuickDecisionWorkspaceCardContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { FINDINGS_ROW_METADATA_TAG_SIZE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveFindingActivityAtUtc } from "@/lib/findings/finding-activity-at-utc";
import { findingEnforcementTierLabel } from "@/lib/findings/finding-enforcement-tier";
import { getFindingDetailHref, getFindingGovernanceDispositionHref } from "@/lib/findings/finding-evidence-navigation";
import {
  buildQuickDecisionFindingEvidenceLinks,
  quickDecisionRecommendationSnippet,
} from "@/lib/quick-decision-finding-links";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
} from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  reviewFindingWatermarkKey,
} from "@/lib/usability/last-visited-watermark";
import { cn } from "@/lib/utils";

export type QuickDecisionWorkspacePrimaryFindingCardProps = {
  readonly context: QuickDecisionWorkspaceCardContext;
  readonly finding: QuickDecisionFinding;
  /** Operate capability: gates the Mute affordance. */
  readonly canMutate: boolean;
  readonly askPanelOpen: boolean;
  readonly onToggleAskPanel: (finding: QuickDecisionFinding) => void;
  readonly onViewReasoning: (finding: QuickDecisionFinding) => void;
  readonly onMute: (finding: QuickDecisionFinding) => void;
};

/** Expanded top-severity finding card for the review findings workspace. */
export function QuickDecisionWorkspacePrimaryFindingCard(
  props: QuickDecisionWorkspacePrimaryFindingCardProps,
): ReactElement {
  const runId = props.context.runId;
  const finding = props.finding;
  const badgeLabel = severityBadgeLabel(finding.severityValue);
  const { evidenceRefCount, viewEvidenceHref } = buildQuickDecisionFindingEvidenceLinks(runId, finding);
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);
  const owner = finding.assignedToUserId?.trim() ?? "";
  const snippet = quickDecisionRecommendationSnippet(finding);
  const findingActivityAt = resolveFindingActivityAtUtc(finding.aiReasoning);
  const findingWatermarkKey = reviewFindingWatermarkKey(runId, finding.findingId);
  const showNewSinceLastVisit = isActivityNewSinceLastVisit(findingWatermarkKey, findingActivityAt);

  return (
    <article
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`finding-workspace-card-${finding.findingId}`}
      data-finding-workspace-primary="true"
      data-finding-id={finding.findingId}
      tabIndex={0}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {showNewSinceLastVisit ? <NewSinceLastVisitMarker testId={`finding-new-${finding.findingId}`} /> : null}
          <SeverityTag
            severity={badgeLabel}
            kind={severityKindFromNumericValue(finding.severityValue)}
            label={badgeLabel}
            className={cn("shrink-0 tabular-nums", FINDINGS_ROW_METADATA_TAG_SIZE)}
          />
          {reviewStatus !== null ? (
            <StatusTag
              kind={reviewStatus.statusKind}
              label={reviewStatus.label}
              className={FINDINGS_ROW_METADATA_TAG_SIZE}
              data-testid={`finding-review-status-${finding.findingId}`}
            />
          ) : (
            <StatusTag kind="neutral" label="Open" className={FINDINGS_ROW_METADATA_TAG_SIZE} />
          )}
          <StatusTag
            kind="neutral"
            label={findingEnforcementTierLabel(finding.enforcementTier)}
            className={cn("shrink-0", FINDINGS_ROW_METADATA_TAG_SIZE)}
          />
        </div>
        <h3 className={cn("m-0 text-xl font-bold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {finding.title}
        </h3>
        <QuickDecisionFindingRationale runId={runId} finding={finding} />
        {snippet.length > 0 ? (
          <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {snippet}
          </p>
        ) : null}
      </header>
      <dl className={cn("m-0 mt-4 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Owner</dt>
          <dd
            className="m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-200"
            data-testid={`finding-owner-${finding.findingId}`}
          >
            {owner.length > 0 ? owner : "No remediation owner assigned"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Confidence</dt>
          <dd className="m-0 mt-0.5">
            {finding.confidenceLevel === "High" ||
            finding.confidenceLevel === "Medium" ||
            finding.confidenceLevel === "Low" ? (
              <FindingConfidenceBadge level={finding.confidenceLevel} />
            ) : (
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Not scored</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Evidence</dt>
          <dd className="m-0 mt-0.5 font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
            {evidenceRefCount} reference{evidenceRefCount === 1 ? "" : "s"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Decision state</dt>
          <dd className="m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
            {reviewStatus?.label ?? "Not recorded"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="default" className="h-8" asChild>
          <Link
            href={getFindingGovernanceDispositionHref(runId, finding.findingId)}
            prefetch={false}
            data-testid={`finding-record-disposition-${finding.findingId}`}
          >
            Record disposition
          </Link>
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8" asChild>
          <Link
            href={getFindingDetailHref(runId, finding.findingId)}
            prefetch={false}
            onClick={() => {
              markLastVisitedNow(findingWatermarkKey, findingActivityAt);
            }}
          >
            Open finding
          </Link>
        </Button>
        {viewEvidenceHref !== null ? (
          <FindingEvidenceLinkChip
            href={viewEvidenceHref}
            evidenceRefCount={evidenceRefCount}
            className="shrink-0"
          />
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
          onClick={() => {
            props.onViewReasoning(finding);
          }}
        >
          View AI reasoning
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
          onClick={() => {
            props.onToggleAskPanel(finding);
          }}
          aria-pressed={props.askPanelOpen}
          title="Ask about this finding"
        >
          <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
          Ask
        </Button>
        {props.canMutate && !finding.isMuted ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
            onClick={() => {
              props.onMute(finding);
            }}
          >
            Mute
          </Button>
        ) : null}
      </div>
      {props.askPanelOpen ? (
        <div className="mt-3">
          <FindingAskInlinePanel findingId={finding.findingId} defaultOpen />
        </div>
      ) : null}
      <QuickDecisionWorkspaceFindingSupportingDetails context={props.context} finding={finding} />
    </article>
  );
}
