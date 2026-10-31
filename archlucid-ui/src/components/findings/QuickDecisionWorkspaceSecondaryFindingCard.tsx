"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { FindingListDispositionRowActions } from "@/components/governance/findings/FindingListDispositionRowActions";
import { FindingDispositionRecordCorrectionControl } from "@/components/governance/findings/FindingDispositionRecordCorrectionControl";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { QuickDecisionFindingRationale } from "@/components/findings/QuickDecisionFindingRationale";
import { FindingClassificationChip } from "@/components/findings/FindingClassificationChip";
import { FindingInsightDensityBand } from "@/components/findings/FindingInsightDensityBand";
import { FindingSemanticSupportBandChip } from "@/components/findings/FindingSemanticSupportBandChip";
import { FindingTrustChip } from "@/components/findings/FindingTrustChip";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import { QuickDecisionWorkspaceFindingSupportingDetails } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import type { QuickDecisionWorkspaceCardContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { FINDINGS_ROW_METADATA_TAG_SIZE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { quickDecisionFindingHasRecordedDisposition } from "@/lib/findings/finding-recorded-disposition";
import {
  resolveQuickDecisionFindingDispositionHref,
  resolveQuickDecisionFindingInspectHref,
} from "@/lib/findings/finding-evidence-navigation";
import { buildQuickDecisionFindingEvidenceLinks } from "@/lib/quick-decision-finding-links";
import { quickDecisionRecommendationSnippet } from "@/lib/quick-decision-finding-links";
import {
  formatQuickDecisionConfidenceWorkspaceLabel,
  formatQuickDecisionFindingOwnerDisplay,
  isKnownQuickDecisionConfidenceLevel,
} from "@/lib/findings/quick-decision-finding-display";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import {
  parseQuickDecisionSecondaryFindingFindingIdFromSearch,
  quickDecisionSecondaryFindingDisclosureHrefFromSearch,
} from "@/lib/findings/quick-decision-secondary-finding-disclosure-url";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
} from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { cn } from "@/lib/utils";

export type QuickDecisionWorkspaceSecondaryFindingCardProps = {
  readonly context: QuickDecisionWorkspaceCardContext;
  readonly finding: QuickDecisionFinding;
  /** Dims low-confidence rows surfaced by the "show low confidence" toggle. */
  readonly subdued?: boolean;
};

/** Collapsed additional-finding card for the review findings workspace. */
export function QuickDecisionWorkspaceSecondaryFindingCard(
  props: QuickDecisionWorkspaceSecondaryFindingCardProps,
): ReactElement {
  const runId = props.context.runId;
  const finding = props.finding;
  const badgeLabel = severityBadgeLabel(finding.severityValue);
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);
  const { evidenceRefCount } = buildQuickDecisionFindingEvidenceLinks(runId, finding);
  const ownerDisplay = formatQuickDecisionFindingOwnerDisplay(
    finding.assignedToUserId,
    "Remediation owner was not stored",
  );
  const confidenceWorkspaceLabel = formatQuickDecisionConfidenceWorkspaceLabel(finding.confidenceLevel);
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const { isWorkingMode } = useWorkspaceMode();
  const findingNavOptions = {
    architectureId: props.context.architectureId,
    isWorkingMode,
  };
  const pathname = usePathname() ?? "/";
  const [cardOpen, setCardOpenState] = useState(() => {
    const fromUrl = parseQuickDecisionSecondaryFindingFindingIdFromSearch(null);

    return fromUrl === finding.findingId;
  });
  const cardOpenRef = useRef(cardOpen);
  cardOpenRef.current = cardOpen;

  const syncCardOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        quickDecisionSecondaryFindingDisclosureHrefFromSearch(
          readWindowLocationSearch(),
          open ? finding.findingId : null,
          pathname,
        ),
        { notify: false },
      );
    },
    [finding.findingId, pathname],
  );

  const setCardOpen = useCallback(
    (open: boolean) => {
      if (cardOpenRef.current === open) {
        return;
      }

      cardOpenRef.current = open;
      setCardOpenState(open);
      syncCardOpenToUrl(open);
    },
    [syncCardOpenToUrl],
  );

  useEffect(() => {
    const syncCardOpenFromUrl = (): void => {
      const fromUrl = parseQuickDecisionSecondaryFindingFindingIdFromSearch(
        new URLSearchParams(window.location.search).get("quickDecisionSecondaryFindingFindingId"),
      );
      const next = fromUrl === finding.findingId;

      if (cardOpenRef.current === next) {
        return;
      }

      cardOpenRef.current = next;
      setCardOpenState(next);
    };

    syncCardOpenFromUrl();
    window.addEventListener("popstate", syncCardOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncCardOpenFromUrl);
    };
  }, [finding.findingId]);

  return (
    <li
      className={cn("list-none pl-0", props.subdued === true ? "opacity-80" : undefined)}
      data-testid={`finding-workspace-card-${finding.findingId}`}
    >
      <details
        className="group rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
        data-workspace-disclosure
        data-finding-id={finding.findingId}
        tabIndex={0}
        open={cardOpen}
        onToggle={(event) => {
          event.preventDefault();
          setCardOpen(!cardOpenRef.current);
        }}
      >
        <summary
          className={cn(
            "flex cursor-pointer list-none items-start gap-2 marker:content-none [&::-webkit-details-marker]:hidden",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <DisclosureTriangleIndicator className="mt-1" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
              />
            ) : null}
            {architectWorkspaceChrome ? (
              <FindingInsightDensityBand
                findingId={finding.findingId}
                insightDensityScore={finding.insightDensityScore}
              />
            ) : null}
            {isDecisionGradeFinding(finding) ? (
              <>
                <FindingTrustChip finding={finding} />
                <FindingSemanticSupportBandChip
                  finding={finding}
                  showReason
                  structuralExecutionMode={props.context.structuralExecutionMode}
                />
              </>
            ) : null}
            {finding.classification === null || finding.classification === undefined ? (
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Classification was not stored
              </span>
            ) : (
              <FindingClassificationChip
                classification={finding.classification}
                treatment={finding.treatment}
                findingId={finding.findingId}
                showReason
              />
            )}
            {isDecisionGradeFinding(finding) ? (
              <p
                className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
                data-testid={`finding-workspace-secondary-density-honesty-${finding.findingId}`}
              >
                {INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}
              </p>
            ) : null}
            <span className="min-w-0 flex-1 font-semibold text-al-text-primary">
              {finding.title.trim().length > 0 ? finding.title : "Finding title was not stored."}
            </span>
          </div>
        </summary>
        <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <QuickDecisionFindingRationale runId={runId} finding={finding} />
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {quickDecisionRecommendationSnippet(finding)}
          </p>
          <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Owner</dt>
              <dd className="m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">{ownerDisplay}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Confidence</dt>
              <dd className="m-0 mt-0.5">
                {isKnownQuickDecisionConfidenceLevel(finding.confidenceLevel) ? (
                  <FindingConfidenceBadge level={finding.confidenceLevel} showScopeLine />
                ) : (
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {confidenceWorkspaceLabel}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Evidence</dt>
              <dd className="m-0 mt-0.5 font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                {evidenceRefCount === null
                  ? "Evidence reference count was not stored"
                  : `${evidenceRefCount} reference${evidenceRefCount === 1 ? "" : "s"}`}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="default" className="h-8" asChild>
              <Link
                href={resolveQuickDecisionFindingDispositionHref(runId, finding.findingId, findingNavOptions)}
                prefetch={false}
                data-testid={`finding-record-disposition-${finding.findingId}`}
              >
                Record finding disposition
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8" asChild>
              <Link
                href={resolveQuickDecisionFindingInspectHref(runId, finding.findingId, findingNavOptions)}
                prefetch={false}
              >
                Open finding
              </Link>
            </Button>
          </div>
          {architectWorkspaceChrome ? (
            <FindingListDispositionRowActions findingId={finding.findingId} compact />
          ) : null}
          {architectWorkspaceChrome && quickDecisionFindingHasRecordedDisposition(finding) ? (
            <FindingDispositionRecordCorrectionControl
              findingId={finding.findingId}
              runId={runId}
              hasRecordedDisposition={true}
              testId={`finding-workspace-record-correction-${finding.findingId}`}
            />
          ) : null}
          <QuickDecisionWorkspaceFindingSupportingDetails context={props.context} finding={finding} />
        </div>
      </details>
    </li>
  );
}
