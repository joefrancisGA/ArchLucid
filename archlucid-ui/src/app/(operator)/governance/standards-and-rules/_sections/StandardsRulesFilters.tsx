import type { StandardsRulesFilterState } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_FILTER_COUNT_TEMPLATE,
  STANDARDS_RULES_REFRESH,
  STANDARDS_RULES_RESET_FILTERS,
} from "@/lib/standards-rules-page";
import { standardsRulesFiltersAreActive } from "@/lib/standards-rules-table-presentation";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { RefreshButton } from "@/components/ui/refresh-button";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { standardsRulesSeverityHrefFromSearch, standardsRulesLinkedFindingsHrefFromSearch, standardsRulesEvidenceCoverageHrefFromSearch, standardsRulesEnforcementHrefFromSearch } from "@/lib/governance/standards-rules-filters-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesFiltersProps = {
  readonly filters: StandardsRulesFilterState;
  readonly currentSearch: string;
  readonly pathname: string;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onClearSearch: () => void;
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
            value={props.searchQuery}
            onChange={(event) => {
              props.onSearchQueryChange(event.target.value);
              onChange({ ...filters, searchQuery: event.target.value });
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && props.searchQuery.trim().length > 0) {
                event.preventDefault();
                props.onClearSearch();
              }
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
      <div className="space-y-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Severity</p>
        <FilterChipGroup aria-label="Filter rules by severity" className="flex flex-wrap gap-2">
          <FilterChip
            href={standardsRulesSeverityHrefFromSearch(props.currentSearch, "all", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.severity === "all", false)}
            aria-current={filters.severity === "all" ? "page" : undefined}
            data-testid="standards-rules-severity-all"
          >
            All
          </FilterChip>
          {options.severities.map((severity) => (
            <FilterChip
              key={severity}
              href={standardsRulesSeverityHrefFromSearch(props.currentSearch, severity, props.pathname)}
              scroll={false}
              className={buyerFilterChipClass(filters.severity === severity, false)}
              aria-current={filters.severity === severity ? "page" : undefined}
              data-testid={`standards-rules-severity-${severity.toLowerCase()}`}
            >
              {severity}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="space-y-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Linked findings</p>
        <FilterChipGroup aria-label="Filter rules by linked findings" className="flex flex-wrap gap-2">
          <FilterChip
            href={standardsRulesLinkedFindingsHrefFromSearch(props.currentSearch, "all", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.linkedFindings === "all", false)}
            aria-current={filters.linkedFindings === "all" ? "page" : undefined}
            data-testid="standards-rules-linked-findings-all"
            onClick={() => {
              onChange({ ...filters, linkedFindings: "all" });
            }}
          >
            All
          </FilterChip>
          <FilterChip
            href={standardsRulesLinkedFindingsHrefFromSearch(props.currentSearch, "linked", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.linkedFindings === "linked", false)}
            aria-current={filters.linkedFindings === "linked" ? "page" : undefined}
            data-testid="standards-rules-linked-findings-linked"
            onClick={() => {
              onChange({ ...filters, linkedFindings: "linked" });
            }}
          >
            Linked
          </FilterChip>
          <FilterChip
            href={standardsRulesLinkedFindingsHrefFromSearch(props.currentSearch, "unlinked", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.linkedFindings === "unlinked", false)}
            aria-current={filters.linkedFindings === "unlinked" ? "page" : undefined}
            data-testid="standards-rules-linked-findings-unlinked"
            onClick={() => {
              onChange({ ...filters, linkedFindings: "unlinked" });
            }}
          >
            Unlinked
          </FilterChip>
        </FilterChipGroup>
      </div>
      <div className="space-y-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Evidence coverage</p>
        <FilterChipGroup aria-label="Filter rules by evidence coverage" className="flex flex-wrap gap-2">
          <FilterChip
            href={standardsRulesEvidenceCoverageHrefFromSearch(props.currentSearch, "all", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.evidenceCoverage === "all", false)}
            aria-current={filters.evidenceCoverage === "all" ? "page" : undefined}
            data-testid="standards-rules-evidence-coverage-all"
            onClick={() => {
              onChange({ ...filters, evidenceCoverage: "all" });
            }}
          >
            All
          </FilterChip>
          <FilterChip
            href={standardsRulesEvidenceCoverageHrefFromSearch(props.currentSearch, "evidenced", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.evidenceCoverage === "evidenced", false)}
            aria-current={filters.evidenceCoverage === "evidenced" ? "page" : undefined}
            data-testid="standards-rules-evidence-coverage-evidenced"
            onClick={() => {
              onChange({ ...filters, evidenceCoverage: "evidenced" });
            }}
          >
            Evidenced
          </FilterChip>
          <FilterChip
            href={standardsRulesEvidenceCoverageHrefFromSearch(props.currentSearch, "unevidenced", props.pathname)}
            scroll={false}
            className={buyerFilterChipClass(filters.evidenceCoverage === "unevidenced", false)}
            aria-current={filters.evidenceCoverage === "unevidenced" ? "page" : undefined}
            data-testid="standards-rules-evidence-coverage-unevidenced"
            onClick={() => {
              onChange({ ...filters, evidenceCoverage: "unevidenced" });
            }}
          >
            Not evidenced
          </FilterChip>
        </FilterChipGroup>
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
        <div className="space-y-2">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Enforcement mode</p>
          <FilterChipGroup aria-label="Filter rules by enforcement mode" className="flex flex-wrap gap-2">
            <FilterChip
              href={standardsRulesEnforcementHrefFromSearch(props.currentSearch, "all", props.pathname)}
              scroll={false}
              className={buyerFilterChipClass(filters.enforcementMode === "all", false)}
              aria-current={filters.enforcementMode === "all" ? "page" : undefined}
              data-testid="standards-rules-enforcement-all"
              onClick={() => {
                onChange({ ...filters, enforcementMode: "all" });
              }}
            >
              All
            </FilterChip>
            {options.enforcementModes.map((enforcementMode) => (
              <FilterChip
                key={enforcementMode}
                href={standardsRulesEnforcementHrefFromSearch(props.currentSearch, enforcementMode, props.pathname)}
                scroll={false}
                className={buyerFilterChipClass(filters.enforcementMode === enforcementMode, false)}
                aria-current={filters.enforcementMode === enforcementMode ? "page" : undefined}
                data-testid={`standards-rules-enforcement-${enforcementMode.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => {
                  onChange({ ...filters, enforcementMode });
                }}
              >
                {enforcementMode}
              </FilterChip>
            ))}
          </FilterChipGroup>
        </div>
        <FilterSelect
          label="Source policy pack"
          value={filters.sourcePolicyPack}
          options={options.policyPacks}
          onChange={(value) => {
            onChange({ ...filters, sourcePolicyPack: value });
          }}
        />
      </div>
    </div>
  );
}
