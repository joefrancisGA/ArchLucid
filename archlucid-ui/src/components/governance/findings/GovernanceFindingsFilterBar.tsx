"use client";

import { memo, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { downloadArchitectureRiskRegisterCsv } from "@/lib/architecture-risk-register-csv";
import {
  matchesRiskRegisterFilter,
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  type RiskRegisterFilter,
} from "@/lib/architecture-risk-register-page";
import { downloadGovernanceFindingsItsmJsonExport } from "@/lib/run-findings-itsm-export";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { GovernanceFindingsFilterPreset } from "@/components/governance/findings/governance-findings-filter-presets";
import { FindingJobViewToggleBar } from "@/components/findings/FindingJobViewToggleBar";
import {
  type FindingJobView,
} from "@/lib/finding-job-view";
import { FindingsNaturalLanguageFilter } from "@/components/findings/FindingsNaturalLanguageFilter";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings-natural-language-filter";
import { BulkTriageRemainingProgress } from "@/components/usability/BulkTriageRemainingProgress";

export type GovernanceFindingsFilterBarProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly onRegisterFilterChange: (filter: RiskRegisterFilter) => void;
  readonly jobView: FindingJobView;
  readonly onJobViewChange: (jobView: FindingJobView) => void;
  readonly savedPresets: readonly GovernanceFindingsFilterPreset[];
  readonly onSaveCurrentFilterAsPreset: () => void;
  readonly onRemovePreset: (id: string) => void;
  readonly groupByResource: boolean;
  readonly onToggleGroupByResource: () => void;
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly filterableRows: readonly GovernanceFindingQueueRow[];
  readonly onNaturalLanguageFilterApply?: (facets: FindingsNaturalLanguageFacets) => void;
};

function GovernanceFindingsFilterBarComponent(props: GovernanceFindingsFilterBarProps): ReactElement {
  const {
    registerFilter,
    onRegisterFilterChange,
    savedPresets,
    onSaveCurrentFilterAsPreset,
    onRemovePreset,
    groupByResource,
    onToggleGroupByResource,
    displayedRows,
  } = props;

  const findingRows = displayedRows.filter((row) => row.recordKind === "finding");
  const totalInView = findingRows.length;
  const openCount = findingRows.filter((row) => matchesRiskRegisterFilter(row, "open")).length;

  return (
    <div className="space-y-2">
      <FindingJobViewToggleBar
        jobView={props.jobView}
        onJobViewChange={props.onJobViewChange}
        governanceRows={props.filterableRows}
      />
      <BulkTriageRemainingProgress openCount={openCount} totalInView={totalInView} />
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="architecture-risk-register-filters"
        aria-label="Findings filters"
      >
        <Button
          type="button"
          size="sm"
          variant={registerFilter === "all" ? "default" : "outline"}
          onClick={() => onRegisterFilterChange("all")}
        >
          {RISK_REGISTER_FILTER_LABELS.all}
        </Button>
        {RISK_REGISTER_QUICK_FILTERS.map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={registerFilter === filter ? "default" : "outline"}
            onClick={() => onRegisterFilterChange(filter)}
          >
            {RISK_REGISTER_FILTER_LABELS[filter]}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={registerFilter === "stale" ? "default" : "outline"}
          onClick={() => onRegisterFilterChange("stale")}
        >
          {RISK_REGISTER_FILTER_LABELS.stale}
        </Button>
        {registerFilter !== "all" && !savedPresets.some((preset) => preset.filter === registerFilter) ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn("h-7 gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            title="Save this filter as a named preset for quick access"
            onClick={onSaveCurrentFilterAsPreset}
          >
            <span aria-hidden="true">⊕</span> Save as preset
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => downloadArchitectureRiskRegisterCsv(displayedRows)}
        >
          Export CSV
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="governance-findings-export-json-button"
          onClick={() => {
            const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

            downloadGovernanceFindingsItsmJsonExport(displayedRows, siteOrigin);
          }}
        >
          Export JSON (work items)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={groupByResource ? "default" : "outline"}
          aria-pressed={groupByResource}
          onClick={onToggleGroupByResource}
        >
          Group by resource
        </Button>
      </div>

      {props.onNaturalLanguageFilterApply !== undefined ? (
        <FindingsNaturalLanguageFilter onApply={props.onNaturalLanguageFilterApply} />
      ) : null}

      {savedPresets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Saved filter presets">
          <span className={OPERATOR_NAV_GROUP_LABEL}>
            Presets:
          </span>
          {savedPresets.map((preset) => (
            <span
              key={preset.id}
              className={cn("inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
            >
              <button
                type="button"
                className="hover:text-teal-700 dark:hover:text-teal-300"
                onClick={() => onRegisterFilterChange(preset.filter)}
              >
                {preset.label}
              </button>
              <button
                type="button"
                className="ml-0.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                aria-label={`Remove preset "${preset.label}"`}
                onClick={() => onRemovePreset(preset.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const GovernanceFindingsFilterBar = memo(GovernanceFindingsFilterBarComponent);
