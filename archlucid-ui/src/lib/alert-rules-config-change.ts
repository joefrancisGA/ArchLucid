import type { AlertRule } from "@/types/alerts";

export type AlertRulesConfigChange = {
  readonly recordedUtc: string;
  readonly actor: string | null;
};

/** Latest alert-rule configuration timestamp across persisted rules (create only — API has no modifier fields). */
export function latestAlertRulesConfigChange(
  items: readonly AlertRule[],
): AlertRulesConfigChange | null {
  if (items.length === 0) {
    return null;
  }

  let latestMs = Number.NEGATIVE_INFINITY;
  let latestUtc: string | null = null;

  for (const item of items) {
    const createdUtc = item.createdUtc?.trim() ?? "";

    if (createdUtc.length === 0) {
      continue;
    }

    const parsed = Date.parse(createdUtc);

    if (Number.isNaN(parsed) || parsed <= latestMs) {
      continue;
    }

    latestMs = parsed;
    latestUtc = createdUtc;
  }

  if (latestUtc === null) {
    return null;
  }

  return {
    recordedUtc: latestUtc,
    actor: null,
  };
}
