import type {
  AiUsageActivityStatusFilter,
  AiUsageActivityTriggerFilter,
  AiUsageBreakdownGroupBy,
} from "@/lib/ai-usage-dashboard-filters";
import { DEFAULT_AI_USAGE_DASHBOARD_FILTERS } from "@/lib/ai-usage-dashboard-filters";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (trigger === DEFAULT_AI_USAGE_DASHBOARD_FILTERS.trigger) {
      params.delete(AI_USAGE_TRIGGER_PARAM);
    } else {
      params.set(AI_USAGE_TRIGGER_PARAM, trigger);
    }
    },
  });
}

export function aiUsageStatusHrefFromSearch(
  currentSearch: string,
  status: AiUsageActivityStatusFilter,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (status === DEFAULT_AI_USAGE_DASHBOARD_FILTERS.status) {
      params.delete(AI_USAGE_STATUS_PARAM);
    } else {
      params.set(AI_USAGE_STATUS_PARAM, status);
    }
    },
  });
}

export function aiUsageFeatureHrefFromSearch(
  currentSearch: string,
  feature: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (feature ?? "").trim();

    if (trimmed.length === 0) {
      params.delete("feature");
    } else {
      params.set("feature", trimmed);
    }
    },
  });
}

export function aiUsageGroupByHrefFromSearch(
  currentSearch: string,
  groupBy: AiUsageBreakdownGroupBy,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (groupBy === DEFAULT_AI_USAGE_DASHBOARD_FILTERS.groupBy) {
      params.delete("groupBy");
    } else {
      params.set("groupBy", groupBy);
    }
    },
  });
}
