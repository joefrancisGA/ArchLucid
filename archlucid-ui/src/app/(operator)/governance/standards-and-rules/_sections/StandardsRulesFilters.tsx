import type { StandardsRulesFilterState } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_FILTER_COUNT_TEMPLATE,
  STANDARDS_RULES_REFRESH,
  STANDARDS_RULES_RESET_FILTERS,
} from "@/lib/standards-rules-page";
import { standardsRulesFiltersAreActive } from "@/lib/standards-rules-table-presentation";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesFiltersProps = {
  readonly filters: StandardsRulesFilterState;
  readonly visibleCount: number;
  readonly totalCount: number;
  readonly options: {
    readonly standards: readonly string[];
    readonly severities: readonly string[];
    readonly enforcementModes: readonly string[];
    readonly policyPacks: readonly string[];
  };
  readonly onChange: (next: StandardsRulesFilterState) => void;
  readonly onReset: () => void;
  readonly onRefresh: () => void;
  readonly refreshing: boolean;
};

function FilterSelect(props: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className={cn("flex min-w-[10rem] flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
      <span className="text-al-text-secondary">{props.label}</span>
      <select
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900"
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      >
        <option value="all">All</option>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StandardsRulesFilters(props: StandardsRulesFiltersProps) {
  const { filters, visibleCount, totalCount, options, onChange, onReset, onRefresh, refreshing } = props;
  const filtersActive = standardsRulesFiltersAreActive(filters);
  const filterCountLabel = STANDARDS_RULES_FILTER_COUNT_TEMPLATE.replace("{visible}", String(visibleCount)).replace(
    "{total}",
    String(totalCount),
  );

  return (
    <div className="mb-4 flex flex-col gap-3" data-testid="standards-rules-filters">
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        aria-live="polite"
        aria-atomic="true"
        data-testid="standards-rules-filter-count"
      >
        {filterCountLabel}
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className={cn("flex min-w-0 flex-1 flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="text-al-text-secondary">Search rules</span>
          <input
            type="search"
            className="max-w-xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900"
            placeholder="Search by rule, standard, category, or pack"
            value={filters.searchQuery}
            onChange={(event) => {
              onChange({ ...filters, searchQuery: event.target.value });
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="standards-rules-reset-filters"
            disabled={!filtersActive}
            onClick={onReset}
          >
            {STANDARDS_RULES_RESET_FILTERS}
          </Button>
          <RefreshButton
            busy={refreshing}
            label={STANDARDS_RULES_REFRESH}
            data-testid="standards-rules-refresh"
            onClick={onRefresh}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <FilterSelect
          label="Standard / Framework"
          value={filters.standardFramework}
          options={options.standards}
          onChange={(value) => {
            onChange({ ...filters, standardFramework: value });
          }}
        />
        <FilterSelect
          label="Severity"
          value={filters.severity}
          options={options.severities}
          onChange={(value) => {
            onChange({ ...filters, severity: value });
          }}
        />
        <FilterSelect
          label="Enforcement mode"
          value={filters.enforcementMode}
          options={options.enforcementModes}
          onChange={(value) => {
            onChange({ ...filters, enforcementMode: value });
          }}
        />
        <FilterSelect
          label="Source policy pack"
          value={filters.sourcePolicyPack}
          options={options.policyPacks}
          onChange={(value) => {
            onChange({ ...filters, sourcePolicyPack: value });
          }}
        />
        <label className={cn("flex min-w-[10rem] flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="text-al-text-secondary">Linked findings</span>
          <select
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900"
            value={filters.linkedFindings}
            onChange={(event) => {
              const value = event.target.value;

              if (value === "linked" || value === "unlinked" || value === "all") {
                onChange({ ...filters, linkedFindings: value });
              }
            }}
          >
            <option value="all">All</option>
            <option value="linked">Linked</option>
            <option value="unlinked">Unlinked</option>
          </select>
        </label>
        <label className={cn("flex min-w-[10rem] flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="text-al-text-secondary">Evidence coverage</span>
          <select
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900"
            value={filters.evidenceCoverage}
            onChange={(event) => {
              const value = event.target.value;

              if (value === "evidenced" || value === "unevidenced" || value === "all") {
                onChange({ ...filters, evidenceCoverage: value });
              }
            }}
          >
            <option value="all">All</option>
            <option value="evidenced">Evidenced</option>
            <option value="unevidenced">Not evidenced</option>
          </select>
        </label>
      </div>
    </div>
  );
}
