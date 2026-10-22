"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Label } from "@/components/ui/label";
import {
  aiUsageFeatureHrefFromSearch,
  aiUsageStatusHrefFromSearch,
  aiUsageTriggerHrefFromSearch,
} from "@/lib/administration/ai-usage-dashboard-filter-url";
import type { AiUsageDashboardFilters } from "@/lib/ai-usage-dashboard-filters";
import { formatAiUsageFeatureLabel } from "@/lib/ai-usage-dashboard-model";
import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly filters: AiUsageDashboardFilters;
  readonly currentSearch: string;
  readonly adminDashboard: AdminAiUsageDashboard | null;
  readonly onFiltersChange: (filters: AiUsageDashboardFilters) => void;
};

const TRIGGER_CHIP_OPTIONS = [
  { value: "all" as const, label: "All triggers" },
  { value: "manual" as const, label: "Manual" },
  { value: "scheduled" as const, label: "Scheduled" },
];

const STATUS_CHIP_OPTIONS = [
  { value: "all" as const, label: "All statuses" },
  { value: "completed" as const, label: "Completed" },
  { value: "skipped" as const, label: "Skipped" },
  { value: "budget_blocked" as const, label: "Budget blocked" },
];

function SelectField(props: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <div className="min-w-[10rem] flex-1">
      <Label htmlFor={props.id} className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>
        {props.label}
      </Label>
      <select
        id={props.id}
        className={cn(
          "w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950",
          OPERATOR_TYPOGRAPHY.body,
        )}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AiUsageFiltersBar(props: Props) {
  const pathname = usePathname() ?? "/administration/ai-usage";
  const features = Object.keys(props.adminDashboard?.usageByFeatureUsd ?? {});
  const users = Array.from(
    new Set((props.adminDashboard?.recentEvents ?? []).map((event) => event.userId ?? "system")),
  );
  const models = Array.from(
    new Set((props.adminDashboard?.recentEvents ?? []).map((event) => event.providerKind).filter((value) => value.trim().length > 0)),
  );

  return (
    <section
      id="ai-usage-filters-bar"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="ai-usage-filters-bar"
      aria-label="AI usage filters"
    >
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Operation type</p>
        <FilterChipGroup aria-label="Filter AI usage by operation type" className="flex flex-wrap gap-2">
          <FilterChip
            href={aiUsageFeatureHrefFromSearch(props.currentSearch, null, pathname)}
            scroll={false}
            className={buyerFilterChipClass(props.filters.feature === null, false)}
            aria-current={props.filters.feature === null ? "page" : undefined}
            data-testid="ai-usage-feature-all"
            onClick={() => {
              props.onFiltersChange({ ...props.filters, feature: null });
            }}
          >
            All operations
          </FilterChip>
          {features.map((feature) => (
            <FilterChip
              key={feature}
              href={aiUsageFeatureHrefFromSearch(props.currentSearch, feature, pathname)}
              scroll={false}
              className={buyerFilterChipClass(props.filters.feature === feature, false)}
              aria-current={props.filters.feature === feature ? "page" : undefined}
              data-testid={`ai-usage-feature-${feature}`}
              onClick={() => {
                props.onFiltersChange({ ...props.filters, feature });
              }}
            >
              {formatAiUsageFeatureLabel(feature)}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="flex flex-wrap gap-3">
        <SelectField
          id="ai-usage-filter-user"
          label="User"
          value={props.filters.userId ?? "all"}
          onChange={(value) =>
            props.onFiltersChange({
              ...props.filters,
              userId: value === "all" ? null : value,
            })
          }
          options={[
            { value: "all", label: "All users" },
            ...users.map((user) => ({ value: user, label: user })),
          ]}
        />
        <SelectField
          id="ai-usage-filter-model"
          label="Model"
          value={props.filters.model ?? "all"}
          onChange={(value) =>
            props.onFiltersChange({
              ...props.filters,
              model: value === "all" ? null : value,
            })
          }
          options={[
            { value: "all", label: "All models" },
            ...models.map((model) => ({ value: model, label: model })),
          ]}
        />
      </div>
      <div className="mt-3 space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Manual vs scheduled</p>
        <FilterChipGroup aria-label="Filter AI usage by trigger" className="flex flex-wrap gap-2">
          {TRIGGER_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              href={aiUsageTriggerHrefFromSearch(props.currentSearch, option.value, pathname)}
              scroll={false}
              className={buyerFilterChipClass(props.filters.trigger === option.value, false)}
              aria-current={props.filters.trigger === option.value ? "page" : undefined}
              data-testid={`ai-usage-trigger-${option.value}`}
              onClick={() => {
                props.onFiltersChange({ ...props.filters, trigger: option.value });
              }}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="mt-3 space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Status</p>
        <FilterChipGroup aria-label="Filter AI usage by status" className="flex flex-wrap gap-2">
          {STATUS_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              href={aiUsageStatusHrefFromSearch(props.currentSearch, option.value, pathname)}
              scroll={false}
              className={buyerFilterChipClass(props.filters.status === option.value, false)}
              aria-current={props.filters.status === option.value ? "page" : undefined}
              data-testid={`ai-usage-status-${option.value}`}
              onClick={() => {
                props.onFiltersChange({ ...props.filters, status: option.value });
              }}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
    </section>
  );
}
