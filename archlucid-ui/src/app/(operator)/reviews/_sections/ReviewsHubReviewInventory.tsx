"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { reviewPackageOwnerLabel } from "@/lib/review-package-validation-picker";
import type { RunSummary } from "@/types/authority";

import {
  REVIEWS_HUB_FILTER_FINALIZED_LABEL,
  REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL,
  REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER,
  REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_SECTION_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import type { ReviewsHubOverallStatus } from "./reviews-hub-review-status";

type ReviewsHubReviewInventoryProps = {
  readonly runs: readonly RunSummary[];
};

type ReviewFilterId =
  | "all"
  | "needs-attention"
  | "updated-recently"
  | "finalized"
  | ReviewsHubOverallStatus;

const STATUS_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "Draft", label: "Draft" },
  { id: "Active", label: "Active" },
  { id: "Awaiting approval", label: "Awaiting approval" },
  { id: "finalized", label: REVIEWS_HUB_FILTER_FINALIZED_LABEL },
  { id: "Archived", label: "Archived" },
  { id: "needs-attention", label: REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL },
  { id: "updated-recently", label: REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL },
];

function matchesSearch(run: RunSummary, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const row = toReviewsHubReviewRowDisplay(run);
  const haystack = [
    row.reviewTitle,
    row.architectureName,
    row.ownerLabel,
    run.runId,
    run.displayName ?? "",
    run.description ?? "",
    run.projectId,
    run.requestId ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function matchesFilter(run: RunSummary, filter: ReviewFilterId): boolean {
  const row = toReviewsHubReviewRowDisplay(run);

  if (filter === "all") {
    return true;
  }

  if (filter === "needs-attention") {
    return row.needsAttention;
  }

  if (filter === "finalized") {
    return row.overallStatus === "Finalized";
  }

  if (filter === "updated-recently") {
    const updatedAt = new Date(run.createdUtc).getTime();

    if (Number.isNaN(updatedAt)) {
      return false;
    }

    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    return Date.now() - updatedAt <= fourteenDaysMs;
  }

  return row.overallStatus === filter;
}

function StatusBadge(props: { readonly label: string; readonly attention?: boolean }): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        props.attention
          ? "border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-600/50 dark:bg-amber-950/40 dark:text-amber-100"
          : "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
      )}
    >
      {props.label}
    </span>
  );
}

/** Filterable review inventory for `/reviews`. */
export function ReviewsHubReviewInventory(props: ReviewsHubReviewInventoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReviewFilterId>("all");
  const rows = useMemo(() => props.runs.map(toReviewsHubReviewRowDisplay), [props.runs]);

  const filteredRuns = useMemo(() => {
    return props.runs.filter((run) => matchesSearch(run, searchQuery) && matchesFilter(run, activeFilter));
  }, [activeFilter, props.runs, searchQuery]);

  return (
    <section className="mt-8" data-testid="reviews-hub-recent-packages">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{REVIEWS_HUB_RECENT_SECTION_TITLE}</h2>

      {rows.length === 0 ? (
        <div
          className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-5 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="reviews-hub-recent-empty"
          role="status"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{REVIEWS_HUB_RECENT_EMPTY_TITLE}</p>
          <p className={cn("m-0 mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEWS_HUB_RECENT_EMPTY_BODY}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href="/reviews/new" data-testid="reviews-hub-recent-empty-start-review">
                {REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={showcaseSampleReviewPackageHref()} data-testid="reviews-hub-recent-empty-sample-review">
                {REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-md">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                aria-label={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                data-testid="reviews-hub-search"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reviews" data-testid="reviews-hub-filters">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const selected = activeFilter === option.id;

                return (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className="h-8"
                    aria-pressed={selected}
                    onClick={() => setActiveFilter(option.id)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <EnterpriseTable ariaLabel={REVIEWS_HUB_RECENT_SECTION_TITLE} data-testid="reviews-hub-packages-table">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Architecture / system</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell className="text-right">Attention</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {filteredRuns.map((run) => {
                  const row = toReviewsHubReviewRowDisplay(run);

                  return (
                    <EnterpriseTableRow
                      key={row.runId}
                      data-testid={row.isSampleReview ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
                    >
                      <EnterpriseTableCell>
                        <div className="min-w-[12rem]">
                          <Link
                            href={row.reviewHref}
                            className={cn(OPERATOR_LINK.nav, "font-medium text-al-text-primary no-underline hover:underline")}
                            aria-label={`Open review ${row.reviewTitle}`}
                          >
                            {row.reviewTitle}
                          </Link>
                          {row.isSampleReview ? (
                            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Sample review</p>
                          ) : null}
                        </div>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>{row.architectureName}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusBadge label={row.overallStatus} attention={row.needsAttention} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>{row.lifecycleStage}</EnterpriseTableCell>
                      <EnterpriseTableCell>{reviewPackageOwnerLabel(run)}</EnterpriseTableCell>
                      <EnterpriseTableCell>{row.lastUpdated}</EnterpriseTableCell>
                      <EnterpriseTableCell className="text-right tabular-nums">
                        {finiteIntegerCountDisplay(row.findingsCount)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="text-right tabular-nums">
                        {finiteIntegerCountDisplay(row.riskCount)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href={row.primaryAction.href} data-testid={`reviews-hub-primary-action-${row.runId}`}>
                            {row.primaryAction.label}
                          </Link>
                        </Button>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </div>

          {filteredRuns.length === 0 ? (
            <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
              No reviews match the current search or filters.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
