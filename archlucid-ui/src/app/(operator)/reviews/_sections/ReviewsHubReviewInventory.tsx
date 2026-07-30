"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
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
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
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
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_RECENT_SECTION_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import { reviewsHubOverallStatusTagKind, type ReviewsHubOverallStatus } from "./reviews-hub-review-status";

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

/** Filterable review inventory for `/reviews`. */
export function ReviewsHubReviewInventory(props: ReviewsHubReviewInventoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReviewFilterId>("all");
  const draftEntries = useArchitectureDraftRegistryEntries();
  const rows = useMemo(() => props.runs.map(toReviewsHubReviewRowDisplay), [props.runs]);
  const resumeDraft = draftEntries[0] ?? null;

  const filteredRuns = useMemo(() => {
    return props.runs.filter((run) => matchesSearch(run, searchQuery) && matchesFilter(run, activeFilter));
  }, [activeFilter, props.runs, searchQuery]);

  return (
    <section className="mt-8" data-testid="reviews-hub-recent-packages">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{REVIEWS_HUB_RECENT_SECTION_TITLE}</h2>

      {rows.length === 0 ? (
        <div
          className="mt-3"
          data-has-architecture-drafts={resumeDraft !== null ? "true" : "false"}
        >
          <EnterpriseCompactEmptyState
            testId="reviews-hub-recent-empty"
            title={resumeDraft !== null ? REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE : REVIEWS_HUB_RECENT_EMPTY_TITLE}
            description={
              resumeDraft !== null ? REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_BODY : REVIEWS_HUB_RECENT_EMPTY_BODY
            }
            actions={[
              {
                label: REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
                href: showcaseSampleReviewPackageHref(),
                variant: "outline",
              },
            ]}
          />
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
                            className={cn(OPERATOR_LINK.nav, "font-medium")}
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
                        <StatusTag
                          kind={reviewsHubOverallStatusTagKind(row.overallStatus, row.needsAttention)}
                          label={row.overallStatus}
                        />
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
