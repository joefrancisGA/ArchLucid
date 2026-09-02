"use client";

import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { GovernanceFindingsQueueActiveFilterChips } from "@/components/governance/findings/GovernanceFindingsQueueActiveFilterChips";
import { GovernanceFindingsRegisterFilterCompact } from "@/components/governance/findings/GovernanceFindingsRegisterFilterCompact";
import { GovernanceFindingsSavedViewsBar } from "@/components/governance/findings/GovernanceFindingsSavedViewsBar";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceFindingsQueueToolbarSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element | null {
  if (props.compactRegisterFilterVisible) {
    return (
      <GovernanceFindingsRegisterFilterCompact
        registerFilter={props.registerFilter}
        onRegisterFilterChange={props.onRegisterFilterChange}
        onClearAllFilters={props.onClearAllFilters}
      />
    );
  }

  if (!props.filterBarVisible) {
    return null;
  }

  return (
    <>
      <GovernanceFindingsFilterBar
        registerFilter={props.registerFilter}
        onRegisterFilterChange={props.onRegisterFilterChange}
        jobView={props.jobView}
        onJobViewChange={props.onJobViewChange}
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
