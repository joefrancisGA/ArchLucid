export type AiUsageBreakdownGroupBy =
  | "workspace"
  | "project"
  | "operation"
  | "model"
  | "user"
  | "run";

export type AiUsageActivityTriggerFilter = "all" | "manual" | "scheduled";

export type AiUsageActivityStatusFilter =
  | "all"
  | "completed"
  | "running"
  | "failed"
  | "skipped"
  | "budget_blocked"
  | "canceled";

export type AiUsageDashboardFilters = {
  readonly groupBy: AiUsageBreakdownGroupBy;
  readonly feature: string | null;
  readonly userId: string | null;
  readonly model: string | null;
  readonly trigger: AiUsageActivityTriggerFilter;
  readonly status: AiUsageActivityStatusFilter;
};

export const DEFAULT_AI_USAGE_DASHBOARD_FILTERS: AiUsageDashboardFilters = {
  groupBy: "project",
  feature: null,
  userId: null,
  model: null,
  trigger: "all",
  status: "all",
};

const GROUP_BY_VALUES: readonly AiUsageBreakdownGroupBy[] = [
  "workspace",
  "project",
  "operation",
  "model",
  "user",
  "run",
];

const TRIGGER_VALUES: readonly AiUsageActivityTriggerFilter[] = ["all", "manual", "scheduled"];

const STATUS_VALUES: readonly AiUsageActivityStatusFilter[] = [
  "all",
  "completed",
  "running",
  "failed",
  "skipped",
  "budget_blocked",
  "canceled",
];

function pickEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value === null || value.trim().length === 0) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if ((allowed as readonly string[]).includes(normalized)) {
    return normalized as T;
  }

  return fallback;
}

function pickOptionalString(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** Parses AI usage dashboard filters from URL search params. */
export function parseAiUsageDashboardFilters(searchParams: URLSearchParams): AiUsageDashboardFilters {
  return {
    groupBy: pickEnum(searchParams.get("groupBy"), GROUP_BY_VALUES, DEFAULT_AI_USAGE_DASHBOARD_FILTERS.groupBy),
    feature: pickOptionalString(searchParams.get("feature")),
    userId: pickOptionalString(searchParams.get("userId")),
    model: pickOptionalString(searchParams.get("model")),
    trigger: pickEnum(searchParams.get("trigger"), TRIGGER_VALUES, DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger),
    status: pickEnum(searchParams.get("status"), STATUS_VALUES, DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status),
  };
}

/** Serializes filters into URL search params (omits defaults). */
export function serializeAiUsageDashboardFilters(filters: AiUsageDashboardFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.groupBy !== DEFAULT_AI_USAGE_DASHBOARD_FILTERS.groupBy) {
    params.set("groupBy", filters.groupBy);
  }

  if (filters.feature !== null) {
    params.set("feature", filters.feature);
  }

  if (filters.userId !== null) {
    params.set("userId", filters.userId);
  }

  if (filters.model !== null) {
    params.set("model", filters.model);
  }

  if (filters.trigger !== DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger) {
    params.set("trigger", filters.trigger);
  }

  if (filters.status !== DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status) {
    params.set("status", filters.status);
  }

  return params;
}
