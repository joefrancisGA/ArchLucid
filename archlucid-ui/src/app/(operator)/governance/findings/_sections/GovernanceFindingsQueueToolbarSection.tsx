"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { GovernanceFindingsQueueActiveFilterChips } from "@/components/governance/findings/GovernanceFindingsQueueActiveFilterChips";
import { GovernanceFindingsRegisterFilterCompact } from "@/components/governance/findings/GovernanceFindingsRegisterFilterCompact";
import { GovernanceFindingsQueueSearchField } from "@/components/governance/findings/GovernanceFindingsQueueSearchField";
import { GovernanceFindingsSavedViewsBar } from "@/components/governance/findings/GovernanceFindingsSavedViewsBar";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  governanceFindingsMoreFiltersHrefFromSearch,
  parseGovernanceFindingsMoreFiltersOpenFromSearch,
} from "@/lib/governance/governance-findings-more-filters-url";
import { cn } from "@/lib/utils";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

function GovernanceFindingsAdvancedFiltersPanel(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  return (
    <>
      <GovernanceFindingsFilterBar
        registerFilter={props.registerFilter}
        onRegisterFilterChange={props.onRegisterFilterChange}
        jobView={props.jobView}
        onJobViewChange={props.onJobViewChange}
        nlFacets={props.nlFacets}
        onNlFacetsChange={props.onNaturalLanguageFilterApply}
        savedPresets={props.savedPresets}
        onSaveCurrentFilterAsPreset={props.onSaveCurrentFilterAsPreset}
        onRemovePreset={props.onRemovePreset}
        groupByResource={props.groupByResource}
        onToggleGroupByResource={props.onToggleGroupByResource}
        displayedRows={props.displayedRows}
        filterableRows={props.scopedRows}
        onNaturalLanguageFilterApply={props.onNaturalLanguageFilterApply}
      />
      <GovernanceFindingsQueueActiveFilterChips
        registerFilter={props.registerFilter}
        jobView={props.jobView}
        nlFacets={props.nlFacets}
        jobViewFilterActive={props.jobViewFilterActive}
        findingsSearchQuery={props.findingsSearchQuery}
        onClearAll={props.onClearAllFilters}
      />
      <GovernanceFindingsSavedViewsBar
        registerFilter={props.registerFilter}
        jobView={props.jobView}
        nlFacets={props.nlFacets}
        groupByResource={props.groupByResource}
        scopedRunId={props.scopedRunId}
        onLoadView={props.onLoadFindingsSavedView}
      />
    </>
  );
}

export function GovernanceFindingsQueueToolbarSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const governanceFindingsMoreFiltersOpenParam = searchParams.get("governanceFindingsMoreFiltersOpen");
  const [moreFiltersOpen, setMoreFiltersOpenState] = useState(() =>
    parseGovernanceFindingsMoreFiltersOpenFromSearch(governanceFindingsMoreFiltersOpenParam),
  );

  const syncMoreFiltersOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        governanceFindingsMoreFiltersHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setMoreFiltersOpen = useCallback(
    (open: boolean) => {
      setMoreFiltersOpenState(open);
      syncMoreFiltersOpenToUrl(open);
    },
    [syncMoreFiltersOpenToUrl],
  );

  useEffect(() => {
    setMoreFiltersOpenState(parseGovernanceFindingsMoreFiltersOpenFromSearch(governanceFindingsMoreFiltersOpenParam));
  }, [governanceFindingsMoreFiltersOpenParam]);

  if (
    props.rows.length === 0 &&
    !props.compactRegisterFilterVisible &&
    !props.filterBarVisible &&
    !props.advancedFiltersDisclosureVisible
  ) {
    return null;
  }

  const advancedFiltersEl = <GovernanceFindingsAdvancedFiltersPanel {...props} />;

  return (
    <>
      {props.rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="governance-findings-queue-toolbar-search-row">
          <GovernanceFindingsQueueSearchField />
        </div>
      ) : null}

      {props.compactRegisterFilterVisible ? (
        <GovernanceFindingsRegisterFilterCompact
          registerFilter={props.registerFilter}
          onRegisterFilterChange={props.onRegisterFilterChange}
          onClearAllFilters={props.onClearAllFilters}
          allCount={props.scopedRows.length}
          openCount={props.registerSummary?.openRisks}
        />
      ) : null}

      {props.advancedFiltersDisclosureVisible ? (
        <details
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          data-testid="governance-findings-more-filters"
          open={moreFiltersOpen}
          onToggle={(event) => {
            setMoreFiltersOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            More filters
          </summary>
          <div className="mt-3 space-y-3">{advancedFiltersEl}</div>
        </details>
      ) : null}

      {props.filterBarVisible ? advancedFiltersEl : null}
    </>
  );
}
