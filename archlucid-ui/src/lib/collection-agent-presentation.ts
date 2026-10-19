import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { CollectionRun } from "@/lib/collection-runs-api";

export const COLLECTION_AGENT_EXPECTED_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type CollectionAgentHealth = {
  readonly kind: EnterpriseStatusKind;
  readonly label: "Ready" | "Needs attention" | "Blocked" | "No successful run stored";
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
    return { kind: "blocked", label: "No successful run stored", successfulRun: null };
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

export const COLLECTION_AGENT_STALE_SUCCESS_NEEDS_ATTENTION_DETAIL =
  "Needs attention because the last success is older than 24 hours. That interval is this page's expectation, not a stored schedule." as const;

export function resolveCollectionAgentStaleSuccessDetail(
  runs: readonly CollectionRun[],
  nowMs: number = Date.now(),
  expectedIntervalMs: number = COLLECTION_AGENT_EXPECTED_INTERVAL_MS,
): string | null {
  const health = resolveCollectionAgentHealth(runs, nowMs, expectedIntervalMs);

  if (health.label !== "Needs attention") {
    return null;
  }

  const latestRun = newestRun(runs);

  if (
    latestRun?.status === "Failed"
    || latestRun?.status === "Rejected"
    || latestRun?.status === "PartiallySucceeded"
  ) {
    return null;
  }

  const successfulRun = health.successfulRun;

  if (successfulRun !== null && nowMs - runTimeMs(successfulRun) > expectedIntervalMs) {
    return COLLECTION_AGENT_STALE_SUCCESS_NEEDS_ATTENTION_DETAIL;
  }

  return null;
}

export function formatCollectionRunDuration(run: CollectionRun): string {
  if (run.finishedUtc === null || run.finishedUtc === undefined) {
    if (run.status === "Running") {
      return "In progress";
    }

    return "Finish time was not stored.";
  }

  const startedUtc = run.startedUtc?.trim() ?? "";

  if (startedUtc.length === 0) {
    return "Start time was not stored.";
  }

  const durationMs = Date.parse(run.finishedUtc) - Date.parse(startedUtc);

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "Duration was not stored.";
  }

  const durationSeconds = Math.round(durationMs / 1000);

  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  return `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
}

export type CollectionRunSubscriptionsPresentation =
  | { readonly kind: "missing" }
  | { readonly kind: "unreadable" }
  | { readonly kind: "empty" }
  | { readonly kind: "listed"; readonly subscriptions: readonly string[] };

export function resolveCollectionRunSubscriptionsPresentation(
  run: CollectionRun,
): CollectionRunSubscriptionsPresentation {
  if (run.subscriptionsCoveredJson === undefined || run.subscriptionsCoveredJson.trim().length === 0) {
    return { kind: "missing" };
  }

  try {
    const parsed: unknown = JSON.parse(run.subscriptionsCoveredJson);

    if (!Array.isArray(parsed)) {
      return { kind: "unreadable" };
    }

    const subscriptions = parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );

    if (subscriptions.length === 0) {
      return { kind: "empty" };
    }

    return { kind: "listed", subscriptions };
  } catch {
    return { kind: "unreadable" };
  }
}

export function formatCollectionRunSubscriptionsLabel(run: CollectionRun): string {
  const presentation = resolveCollectionRunSubscriptionsPresentation(run);

  switch (presentation.kind) {
    case "missing":
      return "Subscriptions covered were not stored.";

    case "unreadable":
      return "Subscriptions covered could not be read.";

    case "empty":
      return "Subscriptions covered were stored as an empty list.";

    case "listed": {
      const countLabel = presentation.subscriptions.length === 1
        ? "1 subscription covered."
        : `${presentation.subscriptions.length} subscriptions covered.`;

      return `${countLabel} ${presentation.subscriptions.join(", ")}`;
    }

    default: {
      const _exhaustive: never = presentation;

      return _exhaustive;
    }
  }
}

export function parseCollectionRunSubscriptions(run: CollectionRun): string[] {
  const presentation = resolveCollectionRunSubscriptionsPresentation(run);

  if (presentation.kind !== "listed") {
    return [];
  }

  return [...presentation.subscriptions];
}
