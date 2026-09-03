import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";

export const AI_USAGE_DAILY_RANGE_PARAM = "range";

export type AiUsageDailyRangePreset = "7d" | "30d";

const AI_USAGE_DAILY_RANGE_IDS = new Set<string>(["7d", "30d"]);

export const DEFAULT_AI_USAGE_DAILY_RANGE: AiUsageDailyRangePreset = "30d";

export function parseAiUsageDailyRangeFromSearch(
  raw: string | null | undefined,
): AiUsageDailyRangePreset {
  if (raw === null || raw === undefined) {
    return DEFAULT_AI_USAGE_DAILY_RANGE;
  }

  const trimmed = raw.trim();

  if (!AI_USAGE_DAILY_RANGE_IDS.has(trimmed)) {
    return DEFAULT_AI_USAGE_DAILY_RANGE;
  }

  return trimmed as AiUsageDailyRangePreset;
}

export function aiUsageDailyRangeHrefFromSearch(
  currentSearch: string,
  range: AiUsageDailyRangePreset,
  pathname: string = AI_USAGE_SETTINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (range === DEFAULT_AI_USAGE_DAILY_RANGE) {
    params.delete(AI_USAGE_DAILY_RANGE_PARAM);
  } else {
    params.set(AI_USAGE_DAILY_RANGE_PARAM, range);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
