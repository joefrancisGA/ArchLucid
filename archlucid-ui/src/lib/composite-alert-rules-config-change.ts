import type { CompositeAlertRule } from "@/types/composite-alert-rules";

import type { AlertRulesConfigChange } from "@/lib/alert-rules-config-change";

/** Latest composite-rule configuration timestamp across persisted rules (create only — API has no modifier fields). */
export function latestCompositeAlertRulesConfigChange(
  items: readonly CompositeAlertRule[],
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
