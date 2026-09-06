"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { FindingListDispositionRowActions } from "@/components/governance/findings/FindingListDispositionRowActions";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { QuickDecisionFindingRationale } from "@/components/findings/QuickDecisionFindingRationale";
import { FindingInsightDensityBand } from "@/components/findings/FindingInsightDensityBand";
import { QuickDecisionWorkspaceFindingSupportingDetails } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import type { QuickDecisionWorkspaceCardContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { FINDINGS_ROW_METADATA_TAG_SIZE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getFindingDetailHref, getFindingGovernanceDispositionHref } from "@/lib/findings/finding-evidence-navigation";
import { quickDecisionRecommendationSnippet } from "@/lib/quick-decision-finding-links";
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
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const quickDecisionSecondaryFindingFindingIdParam = searchParams.get("quickDecisionSecondaryFindingFindingId");
  const [cardOpen, setCardOpenState] = useState(
    () =>
      parseQuickDecisionSecondaryFindingFindingIdFromSearch(quickDecisionSecondaryFindingFindingIdParam) ===
      finding.findingId,
  );

  const syncCardOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        quickDecisionSecondaryFindingDisclosureHrefFromSearch(
          searchParams.toString(),
          open ? finding.findingId : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [finding.findingId, pathname, router, searchParams],
  );

  const setCardOpen = useCallback(
    (open: boolean) => {
      setCardOpenState(open);
      syncCardOpenToUrl(open);
    },
    [syncCardOpenToUrl],
  );

  useEffect(() => {
    setCardOpenState(
      parseQuickDecisionSecondaryFindingFindingIdFromSearch(quickDecisionSecondaryFindingFindingIdParam) ===
        finding.findingId,
    );
  }, [finding.findingId, quickDecisionSecondaryFindingFindingIdParam]);

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
          setCardOpen((event.currentTarget as HTMLDetailsElement).open);
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
            ) : (
              <StatusTag kind="neutral" label="Open" className={FINDINGS_ROW_METADATA_TAG_SIZE} />
            )}
            {architectWorkspaceChrome ? (
              <FindingInsightDensityBand
                findingId={finding.findingId}
                insightDensityScore={finding.insightDensityScore}
              />
            ) : null}
            <span className="min-w-0 flex-1 font-semibold text-al-text-primary">{finding.title}</span>
          </div>
        </summary>
        <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <QuickDecisionFindingRationale runId={runId} finding={finding} />
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {quickDecisionRecommendationSnippet(finding)}
          </p>
          <div className="flex flex-wrap gap-2">
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
              <Link href={getFindingDetailHref(runId, finding.findingId)} prefetch={false}>
                Open finding
              </Link>
            </Button>
          </div>
          {architectWorkspaceChrome ? (
            <FindingListDispositionRowActions findingId={finding.findingId} compact />
          ) : null}
          <QuickDecisionWorkspaceFindingSupportingDetails context={props.context} finding={finding} />
        </div>
      </details>
    </li>
  );
}
