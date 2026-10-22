import type { AlertRoutingSubscription } from "@/types/alert-routing";

export type AlertRoutingConfigChange = {
  readonly recordedUtc: string;
  readonly actor: string | null;
};

/** Latest configuration change across destinations (create or enablement toggle). */
export function latestAlertRoutingConfigChange(
  items: readonly AlertRoutingSubscription[],
): AlertRoutingConfigChange | null {
  if (items.length === 0) {
    return null;
  }

  let latestMs = Number.NEGATIVE_INFINITY;
  let latestUtc: string | null = null;
  let latestActor: string | null = null;

  for (const item of items) {
    const modifiedUtc = item.lastModifiedUtc?.trim() ?? "";
    const createdUtc = item.createdUtc?.trim() ?? "";
    const candidateUtc = modifiedUtc.length > 0 ? modifiedUtc : createdUtc;

    if (candidateUtc.length === 0) {
      continue;
    }

    const parsed = Date.parse(candidateUtc);

    if (Number.isNaN(parsed) || parsed <= latestMs) {
      continue;
    }

    latestMs = parsed;
    latestUtc = candidateUtc;
    latestActor =
      modifiedUtc.length > 0
        ? item.lastModifiedByActor?.trim() || item.createdByActor?.trim() || null
        : item.createdByActor?.trim() || null;
  }

  if (latestUtc === null) {
    return null;
  }

  return {
    recordedUtc: latestUtc,
    actor: latestActor,
  };
}
