"use client";

import { memo, useState, type ReactElement } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { governanceFindingsGroupByHrefFromSearch } from "@/lib/governance/governance-findings-group-by-url";
import {
  governanceFindingsNlSeverityHrefFromSearch,
  governanceFindingsNlStatusHrefFromSearch,
} from "@/lib/governance/governance-findings-queue-nl-facets-url";
import { downloadArchitectureRiskRegisterCsv } from "@/lib/architecture/architecture-risk-register-csv";
import {
  matchesRiskRegisterFilter,
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import { downloadGovernanceFindingsItsmJsonExport } from "@/lib/runs/run-findings-itsm-export";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { GovernanceFindingsFilterPreset } from "@/components/governance/findings/governance-findings-filter-presets";
import { FindingJobViewToggleBar } from "@/components/findings/FindingJobViewToggleBar";
import {
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { FindingsNaturalLanguageFilter } from "@/components/findings/FindingsNaturalLanguageFilter";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import { BulkTriageRemainingProgress } from "@/components/usability/BulkTriageRemainingProgress";

export type GovernanceFindingsFilterBarProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly onRegisterFilterChange: (filter: RiskRegisterFilter) => void;
  readonly jobView: FindingJobView;
  readonly onJobViewChange: (jobView: FindingJobView) => void;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly onNlFacetsChange: (facets: FindingsNaturalLanguageFacets) => void;
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
    onToggleGroupByResource: _onToggleGroupByResource,
    displayedRows,
  } = props;
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [pendingRemovePreset, setPendingRemovePreset] = useState<GovernanceFindingsFilterPreset | null>(null);

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
            className="h-7 gap-1 text-al-text-secondary"
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
        <FilterChip
          href={governanceFindingsGroupByHrefFromSearch(currentSearch, !groupByResource, pathname)}
          scroll={false}
          className={buyerFilterChipClass(groupByResource, false)}
          aria-pressed={groupByResource}
          aria-current={groupByResource ? "page" : undefined}
          data-testid="governance-findings-group-by-resource"
        >
          Group by resource
        </FilterChip>
      </div>

      {props.onNaturalLanguageFilterApply !== undefined ? (
        <FindingsNaturalLanguageFilter onApply={props.onNaturalLanguageFilterApply} />
      ) : null}

      <FilterChipGroup aria-label="Severity facet" className="flex flex-wrap gap-2">
        <FilterChip
          href={governanceFindingsNlSeverityHrefFromSearch(currentSearch, null, pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.nlFacets.severity === null, false)}
          aria-current={props.nlFacets.severity === null ? "page" : undefined}
          data-testid="governance-findings-nl-severity-any"
          onClick={() => {
            props.onNlFacetsChange({ ...props.nlFacets, severity: null });
          }}
        >
          Any severity
        </FilterChip>
        {(["critical", "high", "medium", "low"] as const).map((severity) => (
          <FilterChip
            key={severity}
            href={governanceFindingsNlSeverityHrefFromSearch(currentSearch, severity, pathname)}
            scroll={false}
            className={buyerFilterChipClass(props.nlFacets.severity === severity, false)}
            aria-current={props.nlFacets.severity === severity ? "page" : undefined}
            data-testid={`governance-findings-nl-severity-${severity}`}
            onClick={() => {
              props.onNlFacetsChange({ ...props.nlFacets, severity });
            }}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </FilterChip>
        ))}
      </FilterChipGroup>
      <FilterChipGroup aria-label="Status facet" className="flex flex-wrap gap-2">
        <FilterChip
          href={governanceFindingsNlStatusHrefFromSearch(currentSearch, null, pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.nlFacets.status === null, false)}
          aria-current={props.nlFacets.status === null ? "page" : undefined}
          data-testid="governance-findings-nl-status-any"
          onClick={() => {
            props.onNlFacetsChange({ ...props.nlFacets, status: null });
          }}
        >
          Any status
        </FilterChip>
        <FilterChip
          href={governanceFindingsNlStatusHrefFromSearch(currentSearch, "open", pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.nlFacets.status === "open", false)}
          aria-current={props.nlFacets.status === "open" ? "page" : undefined}
          data-testid="governance-findings-nl-status-open"
          onClick={() => {
            props.onNlFacetsChange({ ...props.nlFacets, status: "open" });
          }}
        >
          Open
        </FilterChip>
        <FilterChip
          href={governanceFindingsNlStatusHrefFromSearch(currentSearch, "disposed", pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.nlFacets.status === "disposed", false)}
          aria-current={props.nlFacets.status === "disposed" ? "page" : undefined}
          data-testid="governance-findings-nl-status-disposed"
          onClick={() => {
            props.onNlFacetsChange({ ...props.nlFacets, status: "disposed" });
          }}
        >
          Disposed
        </FilterChip>
      </FilterChipGroup>

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
                className="hover:text-al-text-primary dark:hover:text-neutral-200"
                onClick={() => onRegisterFilterChange(preset.filter)}
              >
                {preset.label}
              </button>
              <button
                type="button"
                className="ml-0.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                aria-label={`Remove preset "${preset.label}"`}
                data-testid={`governance-findings-remove-preset-${preset.id}`}
                onClick={() => {
                  setPendingRemovePreset(preset);
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <ConfirmationDialog
        open={pendingRemovePreset !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemovePreset(null);
          }
        }}
        title="Remove saved filter?"
        description={
          pendingRemovePreset !== null
            ? `Remove “${pendingRemovePreset.label}” from your saved filters? This cannot be undone.`
            : "Remove this saved filter? This cannot be undone."
        }
        confirmLabel="Remove filter"
        variant="destructive"
        onConfirm={() => {
          if (pendingRemovePreset === null) {
            return;
          }

          onRemovePreset(pendingRemovePreset.id);
          setPendingRemovePreset(null);
        }}
      />
    </div>
  );
}

export const GovernanceFindingsFilterBar = memo(GovernanceFindingsFilterBarComponent);
