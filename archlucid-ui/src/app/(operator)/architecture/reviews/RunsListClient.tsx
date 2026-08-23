"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { InspectorPanel } from "@/components/InspectorPanel";
import { RunsListBuyerFeaturedCard } from "@/components/runs/RunsListBuyerFeaturedCard";
import { RunInspectorPreview } from "@/components/runs/RunInspectorPreview";
import { RunProvenanceInline } from "@/components/runs/RunProvenanceInline";
import { RunsRowBaselineMenu } from "@/components/runs/RunsRowBaselineMenu";
import { RunTableRowErrorBoundary } from "@/components/runs/RunTableRowErrorBoundary";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { ArchitecturePackageOriginBadge } from "@/components/operator-home/runs-dashboard-helpers";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Label } from "@/components/ui/label";
import { RunsListCompareSelectionBar } from "@/components/usability/RunsListCompareSelectionBar";
import { workQueueSectionHeading, runWorkQueueAttentionPartition } from "@/lib/runs/run-work-queue-groups";
import { formatRelativeTime } from "@/lib/relative-time";
import { isNextPublicDemoMode, isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatOperatorProjectIdDisplay } from "@/lib/operator/operator-project-display";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getBuyerSafeReviewsTableLink, getBuyerSafeReviewsTableLinkForRun, getBuyerSafeSignedManifestTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { BUYER_PIPELINE_IN_PROGRESS_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { isRunCommittedForBaseline } from "@/lib/compare-baseline-run";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import type { BuyerPackageScopeFilter, RunsListClientProps, SortOrder } from "./runs-list-types";
import { useRunsList } from "./use-runs-list";

export type { RunsListClientProps } from "./runs-list-types";

function BuyerPackageScopeFilterChips(props: {
  readonly scope: BuyerPackageScopeFilter;
  readonly buyerPipelineLabels: boolean;
  readonly onScopeChange: (scope: BuyerPackageScopeFilter) => void;
}) {
  const inFlightLabel = props.buyerPipelineLabels ? BUYER_PIPELINE_IN_PROGRESS_LABEL : "In flight";
  const options: readonly { readonly id: BuyerPackageScopeFilter; readonly label: string }[] = [
    { id: "all", label: "All" },
    { id: "finalized", label: "Finalized packages" },
    { id: "in_flight", label: inFlightLabel },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <FilterChip
          key={option.id}
          className={buyerFilterChipClass(props.scope === option.id, false)}
          aria-pressed={props.scope === option.id}
          aria-label={`Show: ${option.label}`}
          onClick={() => {
            props.onScopeChange(option.id);
          }}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}

function runRowNumericCountsLine(run: RunSummary, buyerPolished: boolean): string | null {
  const fc = run.findingCount;
  const wc = run.warningCount;
  const ac = run.artifactCount;
  const hasFinding = typeof fc === "number" && Number.isFinite(fc);
  const hasWarning = typeof wc === "number" && Number.isFinite(wc);
  const hasArtifact = typeof ac === "number" && Number.isFinite(ac);

  if (!hasFinding && !hasWarning && !hasArtifact) {
    return null;
  }

  const tokens: string[] = [];

  if (hasFinding) {
    tokens.push(`${fc} findings`);
  }

  if (hasWarning) {
    tokens.push(buyerPolished ? `${wc} monitored risks` : `${wc} warnings`);
  }

  if (hasArtifact) {
    tokens.push(`${ac} artifacts`);
  }

  return tokens.join(" · ");
}

function runRowExplicitCountsLine(run: RunSummary, buyerPolished: boolean): string | null {
  if (isNextPublicDemoMode() && canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID) {
    const c = SHOWCASE_STATIC_DEMO_SPINE_COUNTS;
    const pkgWord = "Package";

    return `${c.findingCount} findings · ${c.warningCount} ${buyerPolished ? "monitored risks" : "warnings"} · ${pkgWord} ${run.hasGoldenManifest ? "finalized" : "pending"}`;
  }

  const numeric = runRowNumericCountsLine(run, buyerPolished);

  if (numeric !== null) {
    const pkgWord = "Package";

    return `${numeric} · ${pkgWord} ${run.hasGoldenManifest ? "finalized" : "pending"}`;
  }

  return null;
}

function runRowOutputReadinessLineBuyer(run: RunSummary): string {
  const complete =
    run.hasContextSnapshot === true &&
    run.hasGraphSnapshot === true &&
    run.hasFindingsSnapshot === true &&
    run.hasGoldenManifest === true;

  if (complete) {
    return "All review steps complete";
  }

  const started =
    run.hasContextSnapshot === true ||
    run.hasGraphSnapshot === true ||
    run.hasFindingsSnapshot === true ||
    run.hasGoldenManifest === true;

  if (started) {
    return "Review underway";
  }

  return "Not started";
}

function runRowAccessibleDescription(
  run: RunSummary,
  activeProjectId: string,
  countsLine: string | null,
  buyerPolished: boolean,
): string {
  const title = runListPrimaryTitle(run);
  const created = new Date(run.createdUtc).toLocaleString();
  const counts = countsLine !== null ? `${countsLine}. ` : "";
  const readiness = buyerPolished ? runRowOutputReadinessLineBuyer(run) : runRowOutputReadinessLine(run);
  const projectNote =
    run.projectId === activeProjectId
      ? ""
      : `Project ${formatOperatorProjectIdDisplay(run.projectId)}. `;

  return `${title}. ${projectNote}${counts}Created ${created}. ${readiness}. Press Enter or Space to open the review preview panel.`;
}

function runRowOutputReadinessLine(run: RunSummary): string {
  const tokens: string[] = [];

  if (run.hasFindingsSnapshot) {
    tokens.push("Findings captured");
  }

  if (run.hasGoldenManifest) {
    tokens.push("Review finalized");
  }

  if (run.hasArtifactBundle) {
    tokens.push("Artifacts bundled");
  }

  const reviewTrailSummary =
    run.hasContextSnapshot === true &&
    run.hasGraphSnapshot === true &&
    run.hasFindingsSnapshot === true &&
    run.hasGoldenManifest === true
      ? "Review trail complete"
      : run.hasContextSnapshot === true ||
          run.hasGraphSnapshot === true ||
          run.hasFindingsSnapshot === true ||
          run.hasGoldenManifest === true
        ? "Review trail partial"
        : "Review trail: not started";

  if (tokens.length === 0) {
    return `Output: in progress · ${reviewTrailSummary}`;
  }

  return `${tokens.join(" · ")} · ${reviewTrailSummary}`;
}

function inspectorTitle(run: RunSummary | null): string {
  if (run === null) {
    return "Review preview";
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return "Review summary";
  }

  return buyerFacingReviewTitleFromSummary(run);
}

function runListPrimaryTitle(run: RunSummary): string {
  return buyerFacingReviewTitleFromSummary(run);
}

function activateRowKeyboard(
  e: KeyboardEvent<HTMLTableRowElement>,
  run: RunSummary,
  onActivate: (run: RunSummary, event: MouseEvent<HTMLTableRowElement>) => void,
) {
  if (e.key !== "Enter" && e.key !== " ") {
    return;
  }

  if ((e.target as HTMLElement).closest("a")) {
    return;
  }

  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
    return;
  }

  e.preventDefault();
  onActivate(run, e as unknown as MouseEvent<HTMLTableRowElement>);
}

function displayRelativeCreated(run: RunSummary): string {
  if (
    isNextPublicDemoMode() ||
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID
  ) {
    return new Date(run.createdUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(run.createdUtc);
}

/**
 * Client-side filter and sort for the current server page of runs; pagination remains server URLs.
 * Large viewports show an inline inspector; smaller viewports use a slide-over sheet.
 */
export function RunsListClient(props: RunsListClientProps) {
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
    buyerPackageScope,
    setBuyerPackageScope,
    sortOrder,
    setSortOrder,
    selectedRun,
    setSelectedRun,
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
      <Label htmlFor="runs-sort-select">Sort by created</Label>
      <select
        id="runs-sort-select"
        value={sortOrder}
        onChange={(event) => {
          setSortOrder(event.target.value as SortOrder);
        }}
        className={cn(
          "rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.body,
        )}
        aria-label="Sort reviews by created date"
      >
        <option value="createdDesc">Newest first</option>
        <option value="createdAsc">Oldest first</option>
      </select>
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
        className={cn(
          "rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
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
            "rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-3 text-teal-950 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100",
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
                    onScopeChange={setBuyerPackageScope}
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
                  onScopeChange={setBuyerPackageScope}
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

            {showBuyerPackageCards ? null : workQueueSections.map((section) => {
              const headingId = `runs-queue-${section.groupId}`;

              return (
                <section
                  key={section.groupId}
                  aria-labelledby={headingId}
                  className="space-y-2"
                  data-testid={headingId}
                  data-attention-partition={runWorkQueueAttentionPartition(section.groupId)}
                >
                  <h3
                    id={headingId}
                    className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}
                  >
                    {workQueueSectionHeading(section.groupId, buyerPipelineLabels)}
                  </h3>
                  <EnterpriseTable ariaLabel={workQueueSectionHeading(section.groupId, buyerPipelineLabels)}>
                    <EnterpriseTableHead>
                      <EnterpriseTableHeadRow>
                        {showCompareSelection ? (
                          <EnterpriseTableHeaderCell className="w-10">
                            <span className="sr-only">Compare</span>
                          </EnterpriseTableHeaderCell>
                        ) : null}
                        <EnterpriseTableHeaderCell>Architecture review</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Created</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                      </EnterpriseTableHeadRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                        {section.runs.map((run) => {
                          const createdLabel = new Date(run.createdUtc).toLocaleString();
                          const isSelected = selectedRun?.runId === run.runId;
                          const title = runListPrimaryTitle(run);
                          const countsLine = runRowExplicitCountsLine(run, buyerPolished);
                          const primaryExplore = buyerPolished
                            ? getBuyerSafeReviewsTableLinkForRun(run)
                            : getBuyerSafeReviewsTableLink(run.runId);
                          const signedManifestExplore = buyerPolished
                            ? getBuyerSafeSignedManifestTableLink(run.runId)
                            : null;
                          const describeRow = runRowAccessibleDescription(run, projectId, countsLine, buyerPolished);

                          return (
                            <RunTableRowErrorBoundary key={run.runId} runId={run.runId}>
                              <EnterpriseTableRow
                                data-testid={`runs-row-${run.runId}`}
                                tabIndex={0}
                                aria-label={describeRow}
                                selected={isSelected}
                                className={cn(
                                  "cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                                )}
                                onClick={(e) => {
                                  onRowActivate(run, e);
                                }}
                                onKeyDown={(e) => {
                                  activateRowKeyboard(e, run, onRowActivate);
                                }}
                              >
                                {showCompareSelection ? (
                                  <EnterpriseTableCell className="w-10 align-top">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                                      checked={compareSelection.includes(run.runId)}
                                      aria-label={`Select ${title} for comparison`}
                                      onChange={() => {
                                        toggleCompareSelection(run.runId);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    />
                                  </EnterpriseTableCell>
                                ) : null}
                                <EnterpriseTableCell className="max-w-[min(100vw,28rem)]">
                                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                    <ArchitecturePackageOriginBadge
                                      run={run}
                                      buyerPolishedShell={buyerPolished}
                                      className="text-[0.6rem]"
                                    />
                                    {/* Status badge leads the row so ARB scanners see state before reading the title */}
                                    <RunStatusBadge run={run} />
                                    <span className={cn("min-w-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                                      {title}
                                    </span>
                                  </div>
                                  {buyerPolished ? (() => {
                                    const meta = buyerDemoPackageCardMeta(run.runId);

                                    if (meta === null) return null;

                                    return (
                                      <div className="mt-1.5 space-y-0.5">
                                        <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.micro)}>
                                          {meta.decisionSummary}
                                        </p>
                                        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.micro)}>
                                          Authority: {meta.approvalAuthority}
                                        </p>
                                      </div>
                                    );
                                  })() : (
                                    <code className={cn("mt-1 block break-all font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                                      {run.runId}
                                    </code>
                                  )}
                                  {run.projectId !== projectId ? (
                                    <p className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.helper)}>
                                      Project{" "}
                                      <span className="font-mono">{formatOperatorProjectIdDisplay(run.projectId)}</span>
                                    </p>
                                  ) : null}
                                  <div className="mt-1.5">
                                    <RunProvenanceInline run={run} buyerPolished={buyerPolished} summaryOnly={buyerPolished} />
                                  </div>
                                  {countsLine !== null ? (
                                    <p
                                      className={cn("m-0 mt-1 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.micro)}
                                      data-testid={`runs-row-counts-${run.runId}`}
                                    >
                                      {countsLine}
                                    </p>
                                  ) : null}
                                  <p
                                    className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.micro)}
                                    data-testid={`runs-row-readiness-${run.runId}`}
                                  >
                                    {buyerPolished ? runRowOutputReadinessLineBuyer(run) : runRowOutputReadinessLine(run)}
                                  </p>
                                </EnterpriseTableCell>
                                <EnterpriseTableCell
                                  className={cn("whitespace-nowrap text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                                  title={createdLabel}
                                >
                                  {displayRelativeCreated(run)}
                                </EnterpriseTableCell>
                                <EnterpriseTableCell className="whitespace-nowrap">
                                  <div className="flex flex-col items-start gap-1.5">
                                    <Link
                                      href={primaryExplore.href}
                                      data-testid={`runs-row-primary-explore-${run.runId}`}
                                      className={OPERATOR_LINK.nav}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      {primaryExplore.label}
                                    </Link>
                                    {!buyerPolished && signedManifestExplore !== null ? (
                                      <Link
                                        href={signedManifestExplore.href}
                                        className={OPERATOR_LINK.nav}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      >
                                        {signedManifestExplore.label}
                                      </Link>
                                    ) : null}
                                    {!buyerPolished && isRunCommittedForBaseline(run) ? (
                                      <RunsRowBaselineMenu runId={run.runId} />
                                    ) : null}
                                  </div>
                                </EnterpriseTableCell>
                              </EnterpriseTableRow>
                            </RunTableRowErrorBoundary>
                          );
                        })}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                </section>
              );
            })}
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
