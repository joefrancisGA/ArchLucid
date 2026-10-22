"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE,
} from "@/lib/governance/governance-overview-copy";

export type GovernanceOverviewLoadReviewSectionProps = {
  readonly buyerPolishedShell: boolean;
  readonly queryRunId: string;
  readonly setQueryRunId: (value: string) => void;
  readonly onLoadReview: () => void;
  readonly listsLoading: boolean;
  readonly hubScopedRunIdTrimmed: string;
  readonly hubScopedRunFilterActive: boolean;
  readonly overviewClearScopeHref: string;
};

export function GovernanceOverviewLoadReviewSection(
  props: GovernanceOverviewLoadReviewSectionProps,
): React.JSX.Element {
  const {
    buyerPolishedShell,
    queryRunId,
    setQueryRunId,
    onLoadReview,
    listsLoading,
    hubScopedRunIdTrimmed,
    hubScopedRunFilterActive,
    overviewClearScopeHref,
  } = props;

  const loadReviewDisabled = listsLoading || queryRunId.trim().length === 0;

  return (
    <section
      aria-labelledby="governance-overview-load-review-heading"
      className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="governance-overview-load-review-section"
    >
      <h2 id="governance-overview-load-review-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {GOVERNANCE_OVERVIEW_LOAD_REVIEW_SECTION_LEAD}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        {hubScopedRunFilterActive ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="governance-overview-run-scope-banner"
          >
            {"Overview scoped to review "}
            <span className="font-mono text-al-text-primary">{hubScopedRunIdTrimmed}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={overviewClearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/architecture/reviews/${encodeURIComponent(hubScopedRunIdTrimmed)}`}
            >
              Open review
            </Link>
          </p>
        ) : (
          <RunIdPicker
            inputId="governance-overview-run"
            label="Review"
            placeholder="Select a review from the list"
            value={queryRunId}
            useBuyerFacingRunLabels={buyerPolishedShell}
            onChange={setQueryRunId}
            preferAutoPick={false}
          />
        )}
        <div className="space-y-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="governance-overview-load-review"
            disabled={loadReviewDisabled}
            onClick={onLoadReview}
          >
            {listsLoading ? "Loading…" : GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION}
          </Button>
          {loadReviewDisabled && !listsLoading ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="governance-overview-load-review-hint">
              {GOVERNANCE_OVERVIEW_LOAD_REVIEW_DISABLED_HINT}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
