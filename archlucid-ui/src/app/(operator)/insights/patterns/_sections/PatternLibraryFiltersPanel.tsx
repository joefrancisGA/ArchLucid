import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PATTERN_LIBRARY_SEARCH_PLACEHOLDER } from "@/lib/pattern-library-copy";
import type { PatternLibraryFiltersState } from "@/lib/pattern-library-types";

type PatternLibraryFiltersPanelProps = {
  readonly filters: PatternLibraryFiltersState;
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
          value={filters.query}
          onChange={(event) => {
            onChange(updateFilter(filters, "query", event.target.value));
          }}
          placeholder={PATTERN_LIBRARY_SEARCH_PLACEHOLDER}
          className={cn(
            "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.body,
          )}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          id="pattern-filter-domain"
          label="Domain"
          value={filters.domain}
          options={[
            "All domains",
            "Financial services",
            "Healthcare",
            "Public sector",
            "SaaS",
            "General",
            "Internal enterprise",
            "Other",
          ]}
          onChange={(value) => {
            onChange(updateFilter(filters, "domain", value as PatternLibraryFiltersState["domain"]));
          }}
        />
        <FilterSelect
          id="pattern-filter-platform"
          label="Platform"
          value={filters.platform}
          options={["All platforms", "AWS", "Azure", "GCP", "Multi-cloud", "Evidence-only"]}
          onChange={(value) => {
            onChange(updateFilter(filters, "platform", value as PatternLibraryFiltersState["platform"]));
          }}
        />
        <FilterSelect
          id="pattern-filter-type"
          label="Pattern type"
          value={filters.patternType}
          options={[
            "All types",
            "Connectivity",
            "Application",
            "Data",
            "Integration",
            "Security",
            "AI and knowledge",
            "Resilience",
            "Migration",
          ]}
          onChange={(value) => {
            onChange(updateFilter(filters, "patternType", value as PatternLibraryFiltersState["patternType"]));
          }}
        />
        <FilterSelect
          id="pattern-filter-risk"
          label="Risk level"
          value={filters.risk}
          options={["All risks", "Low", "Moderate", "High"]}
          onChange={(value) => {
            onChange(updateFilter(filters, "risk", value as PatternLibraryFiltersState["risk"]));
          }}
        />
        <FilterSelect
          id="pattern-filter-adoption"
          label="Adoption"
          value={filters.adoption}
          options={["All adoption", "Common", "Emerging", "Rare", "Declining"]}
          onChange={(value) => {
            onChange(updateFilter(filters, "adoption", value as PatternLibraryFiltersState["adoption"]));
          }}
        />
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
        <FilterSelect
          id="pattern-filter-time"
          label="Time range"
          value={filters.timeRange}
          options={["All time", "Last 90 days", "Last 12 months"]}
          onChange={(value) => {
            onChange(updateFilter(filters, "timeRange", value as PatternLibraryFiltersState["timeRange"]));
          }}
        />
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
