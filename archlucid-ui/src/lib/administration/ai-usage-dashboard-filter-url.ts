import type {
  AiUsageActivityStatusFilter,
  AiUsageActivityTriggerFilter,
} from "@/lib/ai-usage-dashboard-filters";
import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";

export const AI_USAGE_TRIGGER_PARAM = "trigger";
export const AI_USAGE_STATUS_PARAM = "status";

const TRIGGER_IDS = new Set<string>(["all", "manual", "scheduled"]);
const STATUS_IDS = new Set<string>([
  "all",
  "completed",
  "running",
  "failed",
  "skipped",
  "budget_blocked",
  "canceled",
]);

export function parseAiUsageTriggerFromSearch(raw: string | null | undefined): AiUsageActivityTriggerFilter {
  if (raw === null || raw === undefined) {
    return DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!TRIGGER_IDS.has(trimmed)) {
    return DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger;
  }

  return trimmed as AiUsageActivityTriggerFilter;
}

export function parseAiUsageStatusFromSearch(raw: string | null | undefined): AiUsageActivityStatusFilter {
  if (raw === null || raw === undefined) {
    return DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!STATUS_IDS.has(trimmed)) {
    return DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status;
  }

  return trimmed as AiUsageActivityStatusFilter;
}

export function aiUsageTriggerHrefFromSearch(
  currentSearch: string,
  trigger: AiUsageActivityTriggerFilter,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (trigger === DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger) {
    params.delete(AI_USAGE_TRIGGER_PARAM);
  } else {
    params.set(AI_USAGE_TRIGGER_PARAM, trigger);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function aiUsageStatusHrefFromSearch(
  currentSearch: string,
  status: AiUsageActivityStatusFilter,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (status === DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status) {
    params.delete(AI_USAGE_STATUS_PARAM);
  } else {
    params.set(AI_USAGE_STATUS_PARAM, status);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
