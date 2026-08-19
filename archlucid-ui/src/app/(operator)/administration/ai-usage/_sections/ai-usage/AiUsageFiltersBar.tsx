"use client";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import type { AiUsageDashboardFilters } from "@/lib/ai-usage-dashboard-filters";
import { formatAiUsageFeatureLabel } from "@/lib/ai-usage-dashboard-model";
import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly filters: AiUsageDashboardFilters;
  readonly adminDashboard: AdminAiUsageDashboard | null;
  readonly onFiltersChange: (filters: AiUsageDashboardFilters) => void;
};

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
      <div className="flex flex-wrap gap-3">
        <SelectField
          id="ai-usage-filter-feature"
          label="Operation type"
          value={props.filters.feature ?? "all"}
          onChange={(value) =>
            props.onFiltersChange({
              ...props.filters,
              feature: value === "all" ? null : value,
            })
          }
          options={[
            { value: "all", label: "All operations" },
            ...features.map((feature) => ({ value: feature, label: formatAiUsageFeatureLabel(feature) })),
          ]}
        />
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
        <SelectField
          id="ai-usage-filter-trigger"
          label="Manual vs scheduled"
          value={props.filters.trigger}
          onChange={(value) =>
            props.onFiltersChange({
              ...props.filters,
              trigger: value as AiUsageDashboardFilters["trigger"],
            })
          }
          options={[
            { value: "all", label: "All triggers" },
            { value: "manual", label: "Manual" },
            { value: "scheduled", label: "Scheduled" },
          ]}
        />
        <SelectField
          id="ai-usage-filter-status"
          label="Status"
          value={props.filters.status}
          onChange={(value) =>
            props.onFiltersChange({
              ...props.filters,
              status: value as AiUsageDashboardFilters["status"],
            })
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "completed", label: "Completed" },
            { value: "skipped", label: "Skipped" },
            { value: "budget_blocked", label: "Budget blocked" },
          ]}
        />
      </div>
    </section>
  );
}
