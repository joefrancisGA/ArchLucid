import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  patternLibraryDomainHrefFromSearch,
  patternLibraryPlatformHrefFromSearch,
  patternLibraryTypeHrefFromSearch,
  patternLibraryRiskHrefFromSearch,
  patternLibraryAdoptionHrefFromSearch,
  patternLibraryTimeRangeHrefFromSearch,
} from "@/lib/insights/pattern-library-filters-url";
import { PATTERN_LIBRARY_SEARCH_PLACEHOLDER } from "@/lib/pattern-library-copy";
import type {
  PatternAdoptionSignal,
  PatternDomainFilter,
  PatternLibraryFiltersState,
  PatternPlatformFilter,
  PatternRiskSignal,
  PatternTimeRangeFilter,
  PatternTypeFilter,
} from "@/lib/pattern-library-types";

const DOMAIN_CHIP_OPTIONS: readonly PatternDomainFilter[] = [
  "All domains",
  "Financial services",
  "Healthcare",
  "Public sector",
  "SaaS",
  "General",
  "Internal enterprise",
  "Other",
];

const TYPE_CHIP_OPTIONS: readonly PatternTypeFilter[] = [
  "All types",
  "Connectivity",
  "Application",
  "Data",
  "Integration",
  "Security",
  "AI and knowledge",
  "Resilience",
  "Migration",
];

const RISK_CHIP_OPTIONS: readonly (PatternRiskSignal | "All risks")[] = [
  "All risks",
  "Low",
  "Moderate",
  "High",
];

const TIME_CHIP_OPTIONS: readonly PatternTimeRangeFilter[] = [
  "All time",
  "Last 90 days",
  "Last 12 months",
];

const ADOPTION_CHIP_OPTIONS: readonly (PatternAdoptionSignal | "All adoption")[] = [
  "All adoption",
  "Common",
  "Emerging",
  "Rare",
  "Declining",
];

const PLATFORM_CHIP_OPTIONS: readonly PatternPlatformFilter[] = [
  "All platforms",
  "AWS",
  "Azure",
  "GCP",
  "Multi-cloud",
  "Evidence-only",
];

type PatternLibraryFiltersPanelProps = {
  readonly filters: PatternLibraryFiltersState;
  readonly currentSearch: string;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly onChange: (next: PatternLibraryFiltersState) => void;
};

function updateFilter<K extends keyof PatternLibraryFiltersState>(
  filters: PatternLibraryFiltersState,
  key: K,
  value: PatternLibraryFiltersState[K],
): PatternLibraryFiltersState {
  return { ...filters, [key]: value };
}

export function PatternLibraryFiltersPanel(props: PatternLibraryFiltersPanelProps): React.JSX.Element {
  const { filters, onChange } = props;

  return (
    <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950" data-testid="pattern-library-filters">
      <div className="grid gap-2">
        <Label htmlFor="pattern-library-search">{PATTERN_LIBRARY_SEARCH_PLACEHOLDER}</Label>
        <input
          id="pattern-library-search"
          type="search"
          value={props.searchQuery}
          onChange={(event) => {
            props.onSearchQueryChange(event.target.value);
            onChange(updateFilter(filters, "query", event.target.value));
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && props.searchQuery.trim().length > 0) {
              event.preventDefault();
              props.onClearSearch();
            }
          }}
          placeholder={PATTERN_LIBRARY_SEARCH_PLACEHOLDER}
          className={cn(
            "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.body,
          )}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Domain</p>
        <FilterChipGroup aria-label="Filter patterns by domain" className="flex flex-wrap gap-2">
          {DOMAIN_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryDomainHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.domain === option, false)}
              aria-current={filters.domain === option ? "page" : undefined}
              data-testid={`pattern-library-domain-${option.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Platform</p>
        <FilterChipGroup aria-label="Filter patterns by platform" className="flex flex-wrap gap-2">
          {PLATFORM_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryPlatformHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.platform === option, false)}
              aria-current={filters.platform === option ? "page" : undefined}
              data-testid={`pattern-library-platform-${option.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Pattern type</p>
        <FilterChipGroup aria-label="Filter patterns by type" className="flex flex-wrap gap-2">
          {TYPE_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryTypeHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.patternType === option, false)}
              aria-current={filters.patternType === option ? "page" : undefined}
              data-testid={`pattern-library-type-${option.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                onChange(updateFilter(filters, "patternType", option));
              }}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Risk level</p>
        <FilterChipGroup aria-label="Filter patterns by risk level" className="flex flex-wrap gap-2">
          {RISK_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryRiskHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.risk === option, false)}
              aria-current={filters.risk === option ? "page" : undefined}
              data-testid={`pattern-library-risk-${option.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                onChange(updateFilter(filters, "risk", option));
              }}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Adoption</p>
        <FilterChipGroup aria-label="Filter patterns by adoption" className="flex flex-wrap gap-2">
          {ADOPTION_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryAdoptionHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.adoption === option, false)}
              aria-current={filters.adoption === option ? "page" : undefined}
              data-testid={`pattern-library-adoption-${option.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                onChange(updateFilter(filters, "adoption", option));
              }}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FilterSelect
          id="pattern-filter-governance"
          label="Approval impact"
          value={filters.governance}
          options={[
            "All governance",
            "Usually approved",
            "Often requires exception",
            "Needs evidence",
            "Frequently flagged",
          ]}
          onChange={(value) => {
            onChange(updateFilter(filters, "governance", value as PatternLibraryFiltersState["governance"]));
          }}
        />
        <FilterSelect
          id="pattern-filter-source"
          label="Data source"
          value={filters.dataSource}
          options={["All sources", "Sample data", "Anonymized aggregate"]}
          onChange={(value) => {
            onChange(updateFilter(filters, "dataSource", value as PatternLibraryFiltersState["dataSource"]));
          }}
        />
      </div>

      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Time range</p>
        <FilterChipGroup aria-label="Filter patterns by time range" className="flex flex-wrap gap-2">
          {TIME_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={patternLibraryTimeRangeHrefFromSearch(props.currentSearch, option)}
              scroll={false}
              className={buyerFilterChipClass(filters.timeRange === option, false)}
              aria-current={filters.timeRange === option ? "page" : undefined}
              data-testid={`pattern-library-time-${option.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                onChange(updateFilter(filters, "timeRange", option));
              }}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
    </section>
  );
}

type FilterSelectProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
};

function FilterSelect(props: FilterSelectProps): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger id={props.id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BadgeChip(props: { readonly children: string; readonly className?: string }): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn("font-medium", OPERATOR_TYPOGRAPHY.badge, props.className)}>
      {props.children}
    </Badge>
  );
}

export function PatternLibrarySignalBadges(props: {
  readonly adoption: string;
  readonly risk: string;
  readonly governance: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      <BadgeChip>{props.adoption}</BadgeChip>
      <BadgeChip className="border-amber-300/80 text-amber-900 dark:border-amber-800 dark:text-amber-200">
        {`${props.risk} risk`}
      </BadgeChip>
      <BadgeChip>{props.governance}</BadgeChip>
    </div>
  );
}

export function PatternLibraryDomainPlatformBadges(props: {
  readonly domains: readonly string[];
  readonly platforms: readonly string[];
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {props.domains.map((domain) => (
        <BadgeChip key={domain}>{domain}</BadgeChip>
      ))}
      {props.platforms.map((platform) => (
        <BadgeChip key={platform} className="border-neutral-300 dark:border-neutral-700">
          {platform}
        </BadgeChip>
      ))}
    </div>
  );
}
