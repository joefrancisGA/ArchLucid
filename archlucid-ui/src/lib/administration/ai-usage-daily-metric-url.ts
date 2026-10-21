import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import type { AiUsageDailyMetric } from "@/lib/ai-usage-dashboard-model-types";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const AI_USAGE_DAILY_METRIC_PARAM = "metric";

const METRIC_IDS = new Set<string>(["cost", "tokens", "operations", "requests"]);

export const DEFAULT_AI_USAGE_DAILY_METRIC: AiUsageDailyMetric = "cost";

export function parseAiUsageDailyMetricFromSearch(
  raw: string | null | undefined,
): AiUsageDailyMetric {
  if (raw === null || raw === undefined) {
    return DEFAULT_AI_USAGE_DAILY_METRIC;
  }

  const trimmed = raw.trim();

  if (!METRIC_IDS.has(trimmed)) {
    return DEFAULT_AI_USAGE_DAILY_METRIC;
  }

  return trimmed as AiUsageDailyMetric;
}

export function aiUsageDailyMetricHrefFromSearch(
  currentSearch: string,
  metric: AiUsageDailyMetric,
  pathname: string = AI_USAGE_SETTINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (metric === DEFAULT_AI_USAGE_DAILY_METRIC) {
      params.delete(AI_USAGE_DAILY_METRIC_PARAM);
    } else {
      params.set(AI_USAGE_DAILY_METRIC_PARAM, metric);
    }
    },
  });
}
