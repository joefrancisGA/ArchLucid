import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { CollectionRun } from "@/lib/collection-runs-api";

export const COLLECTION_AGENT_EXPECTED_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type CollectionAgentHealth = {
  readonly kind: EnterpriseStatusKind;
  readonly label: "Ready" | "Needs attention" | "Blocked";
  readonly successfulRun: CollectionRun | null;
};

function runTimeMs(run: CollectionRun): number {
  return Date.parse(run.finishedUtc ?? run.startedUtc ?? "");
}

function newestRun(runs: readonly CollectionRun[]): CollectionRun | null {
  return runs.reduce<CollectionRun | null>(
    (current, run) => current === null || runTimeMs(run) > runTimeMs(current) ? run : current,
    null,
  );
}

export function resolveCollectionAgentHealth(
  runs: readonly CollectionRun[],
  nowMs: number = Date.now(),
  expectedIntervalMs: number = COLLECTION_AGENT_EXPECTED_INTERVAL_MS,
): CollectionAgentHealth {
  const successfulRun = newestRun(
    runs.filter((run) => run.status === "Succeeded" || run.status === "Imported"),
  );
  const latestRun = newestRun(runs);

  if (successfulRun === null) {
    return { kind: "blocked", label: "Blocked", successfulRun: null };
  }

  if (
    latestRun?.status === "Failed"
    || latestRun?.status === "Rejected"
    || latestRun?.status === "PartiallySucceeded"
    || nowMs - runTimeMs(successfulRun) > expectedIntervalMs
  ) {
    return { kind: "needs-attention", label: "Needs attention", successfulRun };
  }

  return { kind: "ready", label: "Ready", successfulRun };
}

export function formatCollectionRunDuration(run: CollectionRun): string {
  if (run.finishedUtc === null || run.finishedUtc === undefined) {
    return "In progress";
  }

  const durationMs = Date.parse(run.finishedUtc) - Date.parse(run.startedUtc ?? "");

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "Duration unavailable";
  }

  const durationSeconds = Math.round(durationMs / 1000);

  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  return `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
}

export function parseCollectionRunSubscriptions(run: CollectionRun): string[] {
  if (run.subscriptionsCoveredJson === undefined || run.subscriptionsCoveredJson.trim().length === 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(run.subscriptionsCoveredJson);

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }

    return [];
  } catch {
    return [];
  }
}
