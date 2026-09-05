"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { InspectorPanel } from "@/components/InspectorPanel";
import { RunsListBuyerFeaturedCard } from "@/components/runs/RunsListBuyerFeaturedCard";
import { RunInspectorPreview } from "@/components/runs/RunInspectorPreview";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Label } from "@/components/ui/label";
import { RunsListCompareSelectionBar } from "@/components/usability/RunsListCompareSelectionBar";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { resolveContinueLastRunsListRow } from "@/lib/resolve-continue-last-runs-list-row";
import { resolveReviewsHubResumeAffordancePlan } from "@/lib/reviews-hub-resume-affordance";
import {
  parseRunsListSortFromSearch,
  runsListSortHrefFromSearch,
} from "@/lib/runs/runs-list-sort-url";

import type { RunsListClientProps } from "./runs-list-types";
import { useRunsList } from "./use-runs-list";
import { RunsListContinueLastViewedRow } from "./RunsListContinueLastViewedRow";
import { BuyerPackageScopeFilterChips } from "./BuyerPackageScopeFilterChips";
import { RunsListWorkQueueTable } from "./RunsListWorkQueueTable";
import { inspectorTitle } from "./runs-list-row-presentation";

export type { RunsListClientProps } from "./runs-list-types";

/**
 * Client-side filter and sort for the current server page of runs; pagination remains server URLs.
 * Large viewports show an inline inspector; smaller viewports use a slide-over sheet.
 */
export function RunsListClient(props: RunsListClientProps) {
  const pathname = usePathname() ?? "/architecture/reviews";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const activeSort = parseRunsListSortFromSearch(searchParams.get("sort"));
  const {
    projectId,
    page,
    totalCount,
    listContextFilter,
    buyerPolished,
    buyerPipelineLabels,
    buyerCollapseFilters,
    filterText,
    setFilterText,
    clearFilterText,
    buyerPackageScope,
    sortOrder,
    setSortOrder: _setSortOrder,
    selectedRun,
    compareSelection,
    compareSelectionNotice,
    paginationAnnouncement,
    mobileInspectorShellRef,
    viewportNarrow,
    closeInspector,
    filteredSorted,
    workQueueSections,
    pages,
    previousHref,
    nextHref,
    onRowActivate,
    showBuyerPackageCards,
    showCompareSelection,
    toggleCompareSelection,
    clearCompareSelection,
    filterStatusLine,
  } = useRunsList(props);

  const continueLastViewedRun = useMemo(
    () => resolveContinueLastRunsListRow(props.runs),
    [props.runs],
  );
  const continueLastResumePlan = useMemo(
    () =>
      resolveReviewsHubResumeAffordancePlan({
        continueStripRunId: props.continueStripRunId ?? null,
        continueLastViewedRunId: continueLastViewedRun?.runId ?? null,
      }),
    [continueLastViewedRun?.runId, props.continueStripRunId],
  );

  const inspectorBody =
    selectedRun === null ? (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="run-inspector-empty">
        {buyerPolished
          ? "Select a review to preview key outputs here."
          : "Select a review to preview details here."}
      </p>
    ) : (
      <RunInspectorPreview run={selectedRun} />
    );

  const runsSortControl = (
    <div className="flex flex-col gap-1">
      <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>Sort by created</span>
      <FilterChipGroup aria-label="Sort reviews by created date" className="flex flex-wrap gap-2">
        {(
          [
            { id: "created-desc" as const, label: "Newest first" },
            { id: "created-asc" as const, label: "Oldest first" },
          ] as const
        ).map((option) => (
          <FilterChip
            key={option.id}
            href={runsListSortHrefFromSearch(currentSearch, option.id, pathname)}
            scroll={false}
            className={buyerFilterChipClass(activeSort === option.id, false)}
            aria-current={activeSort === option.id ? "page" : undefined}
            data-testid={`runs-list-sort-${option.id}`}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterChipGroup>
    </div>
  );

  const runsFilterControl = (
    <div
      className={cn(
        "flex flex-col gap-1",
        buyerPolished ? "max-w-full" : "min-w-[12rem] max-w-md flex-1",
      )}
    >
      <Label htmlFor="runs-filter-input">
        {buyerPolished ? "Search architecture reviews" : "Filter by review name or description"}
      </Label>
      <input
        id="runs-filter-input"
        type="search"
        value={filterText}
        onChange={(event) => {
          setFilterText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && filterText.trim().length > 0) {
            event.preventDefault();
            clearFilterText();
          }
        }}
        className={cn(
          "rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.body,
          buyerPolished && "w-full max-w-none",
        )}
        autoComplete="off"
        autoFocus={!buyerCollapseFilters}
        aria-label={
          buyerPolished
            ? "Search reviews by title or description"
            : buyerPolished
              ? "Filter reviews by name or description"
              : "Filter reviews by name or description"
        }
        aria-controls="runs-list-filter-status"
      />
    </div>
  );

  const runsListFilterStatus = (
    <p
      id="runs-list-filter-status"
      role="status"
      className={cn(
        OPERATOR_TYPOGRAPHY.helper,
        buyerPolished && "sm:max-w-[min(100%,20rem)] sm:text-right",
      )}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="true"
    >
      {filterStatusLine}
    </p>
  );

  return (
    <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
      {listContextFilter === "orphan-candidates" ? (
        <div
          className={cn(
            "rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
          data-testid="runs-list-orphan-candidates-filter-banner"
        >
          <p className="m-0 font-medium">Orphan candidates</p>
          <p className="m-0 mt-1 leading-snug">
            Showing reviews in context for orphan-candidate ROI evidence. Open a committed review&apos;s artifacts for{" "}
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>orphan-candidates.json</span>, or return to the{" "}
            <Link href={SPONSOR_DASHBOARD_HREF} className={OPERATOR_LINK.nav}>
              sponsor dashboard
            </Link>{" "}
            KPI tile.
          </p>
        </div>
      ) : null}
      {buyerPolished && totalCount <= 1 ? null : buyerPolished ? (
        buyerCollapseFilters ? (
          <details className="rounded-lg border border-neutral-200 bg-neutral-50/40 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30">
            <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolished ? "Filter reviews" : "Filter reviews"}
            </summary>
            <div className="mt-3 space-y-3">
              {runsFilterControl}
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className={cn("mb-1.5", OPERATOR_NAV_GROUP_LABEL)}>
                  Show
                </legend>
                <div className="flex flex-wrap gap-2">
                  <BuyerPackageScopeFilterChips
                    scope={buyerPackageScope}
                    buyerPipelineLabels={buyerPipelineLabels}
                  />
                </div>
              </fieldset>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                {runsSortControl}
                {runsListFilterStatus}
              </div>
            </div>
          </details>
        ) : (
          <div className="space-y-3">
            {runsFilterControl}
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className={cn("mb-1.5", OPERATOR_NAV_GROUP_LABEL)}>
                Show
              </legend>
              <div className="flex flex-wrap gap-2">
                <BuyerPackageScopeFilterChips
                  scope={buyerPackageScope}
                  buyerPipelineLabels={buyerPipelineLabels}
                />
              </div>
            </fieldset>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              {runsSortControl}
              {runsListFilterStatus}
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {runsFilterControl}
          {runsSortControl}
          {runsListFilterStatus}
        </div>
      )}

      <div className={cn("pt-4", !viewportNarrow && "lg:flex lg:items-stretch lg:gap-4")}>
        <div className={cn("min-w-0 flex-1 space-y-4", !viewportNarrow && "lg:min-w-0")}>
          <div className="space-y-4">
            {continueLastViewedRun !== null && continueLastResumePlan.showContinueLastViewed ? (
              <RunsListContinueLastViewedRow
                run={continueLastViewedRun}
                variant={continueLastResumePlan.continueLastViewedVariant}
              />
            ) : null}
            {showCompareSelection ? (
              <RunsListCompareSelectionBar
                selectedRunIds={compareSelection}
                selectionNotice={compareSelectionNotice}
                onClear={clearCompareSelection}
              />
            ) : null}
            {showBuyerPackageCards ? (
              <div className="space-y-2">
                {filteredSorted.every((r) => r.hasGoldenManifest === true) ? (
                  <h3 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
                    Finalized architecture reviews
                  </h3>
                ) : null}
                <div className="grid gap-4">
                  {filteredSorted.map((run) => (
                    <RunsListBuyerFeaturedCard key={run.runId} run={run} />
                  ))}
                </div>
              </div>
            ) : null}

            {showBuyerPackageCards ? null : filteredSorted.length === 0 ? (
              <EnterpriseTable ariaLabel="Architecture reviews (empty)">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Architecture review</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Created</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  <EnterpriseTableRow>
                    <EnterpriseTableCell colSpan={3} className="text-al-text-secondary">
                      No reviews match this filter.
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                </EnterpriseTableBody>
              </EnterpriseTable>
            ) : null}

            {showBuyerPackageCards ? null : (
              <RunsListWorkQueueTable
                sections={workQueueSections}
                projectId={projectId}
                buyerPolished={buyerPolished}
                buyerPipelineLabels={buyerPipelineLabels}
                showCompareSelection={showCompareSelection}
                compareSelection={compareSelection}
                selectedRun={selectedRun}
                onRowActivate={onRowActivate}
                toggleCompareSelection={toggleCompareSelection}
              />
            )}
          </div>

          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {paginationAnnouncement}
          </div>
          {showBuyerPackageCards ? null : buyerPolished && pages === 1 && totalCount === 1 ? (
            <p className={cn("m-0 mt-5", OPERATOR_TYPOGRAPHY.helper)}>1 review on this page</p>
          ) : (
            <nav
              className={cn("mt-5 flex flex-wrap items-center gap-4", OPERATOR_TYPOGRAPHY.body)}
              aria-label="Reviews pagination"
            >
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                Page {page} of {pages} · {totalCount} review{totalCount === 1 ? "" : "s"} total
              </span>
              {page > 1 ? (
                <Link
                  className={cn("font-semibold", OPERATOR_LINK.nav)}
                  href={previousHref}
                  aria-label={page === 2 ? "Previous page" : "First page (keyset pagination)"}
                >
                  {page === 2 ? "Previous" : "First page"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={cn(
                    "cursor-not-allowed font-semibold text-neutral-400 dark:text-neutral-500",
                  )}
                >
                  Previous
                </button>
              )}
              {page < pages ? (
                <Link
                  className={cn("font-semibold", OPERATOR_LINK.nav)}
                  href={nextHref}
                >
                  Next
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={cn(
                    "cursor-not-allowed font-semibold text-neutral-400 dark:text-neutral-500",
                  )}
                >
                  Next
                </button>
              )}
            </nav>
          )}
        </div>

        {!viewportNarrow ? (
          <InspectorPanel
            title={inspectorTitle(selectedRun)}
            onClose={closeInspector}
            listenEscape={false}
            className="mt-4 hidden min-h-[16rem] shrink-0 lg:mt-0 lg:flex"
          >
            {inspectorBody}
          </InspectorPanel>
        ) : null}
      </div>

      {viewportNarrow && selectedRun !== null ? (
        <div
          ref={mobileInspectorShellRef}
          className="fixed inset-0 z-40 flex justify-end"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            tabIndex={-1}
            aria-hidden="true"
            onClick={closeInspector}
          />
          <div className="animate-in slide-in-from-right relative h-full w-full max-w-sm duration-200 ease-out">
            <InspectorPanel
              title={inspectorTitle(selectedRun)}
              onClose={closeInspector}
              listenEscape={false}
              className="h-full max-w-sm border-l-0 shadow-xl sm:border-l"
              widthClassName="w-full"
            >
              {inspectorBody}
            </InspectorPanel>
          </div>
        </div>
      ) : null}
    </div>
  );
}
