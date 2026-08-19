import type { ItsmFindingCorrelationListItem } from "@/lib/api/itsm-outbound-api";
import { listItsmFindingCorrelationsBatch } from "@/lib/api/itsm-outbound-api";

export type ItsmFindingCorrelationsEntry = {
  correlations: readonly ItsmFindingCorrelationListItem[];
  loaded: boolean;
  error: boolean;
};

type Listener = () => void;

const MAX_BATCH_SIZE = 100;
const entries = new Map<string, ItsmFindingCorrelationsEntry>();
const listeners = new Set<Listener>();
const pendingFindingIds = new Set<string>();
let flushScheduled = false;
let inFlightBatch: Promise<void> | undefined;

function emptyEntry(): ItsmFindingCorrelationsEntry {
  return {
    correlations: [],
    loaded: false,
    error: false,
  };
}

function getEntry(findingId: string): ItsmFindingCorrelationsEntry {
  const existing = entries.get(findingId);

  if (existing !== undefined) {
    return existing;
  }

  const created = emptyEntry();
  entries.set(findingId, created);

  return created;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function scheduleBatchFlush(): void {
  if (flushScheduled) {
    return;
  }

  flushScheduled = true;

  queueMicrotask(() => {
    flushScheduled = false;
    void flushPendingFindingCorrelations();
  });
}

async function flushPendingFindingCorrelations(): Promise<void> {
  if (pendingFindingIds.size === 0) {
    return;
  }

  if (inFlightBatch !== undefined) {
    await inFlightBatch;
  }

  const findingIds = Array.from(pendingFindingIds).slice(0, MAX_BATCH_SIZE);
  pendingFindingIds.clear();

  if (findingIds.length === 0) {
    return;
  }

  inFlightBatch = (async () => {
    try {
      const body = await listItsmFindingCorrelationsBatch(findingIds);

      for (const findingId of findingIds) {
        entries.set(findingId, {
          correlations: [],
          loaded: true,
          error: false,
        });
      }

      for (const finding of body.findings ?? []) {
        if (finding.findingId === undefined || finding.findingId.trim().length === 0) {
          continue;
        }

        entries.set(finding.findingId, {
          correlations: finding.correlations ?? [],
          loaded: true,
          error: false,
        });
      }
    } catch {
      for (const findingId of findingIds) {
        const current = getEntry(findingId);

        if (!current.loaded) {
          entries.set(findingId, {
            correlations: [],
            loaded: true,
            error: true,
          });
        }
      }
    } finally {
      notifyListeners();
      inFlightBatch = undefined;
    }
  })();

  await inFlightBatch;

  if (pendingFindingIds.size > 0) {
    scheduleBatchFlush();
  }
}

/** Queues one or more finding ids for a batched correlation load. */
export function requestItsmFindingCorrelations(findingIds: readonly string[]): void {
  let changed = false;

  for (const findingId of findingIds) {
    if (findingId.trim().length === 0) {
      continue;
    }

    const entry = getEntry(findingId);

    if (entry.loaded) {
      continue;
    }

    pendingFindingIds.add(findingId);
    changed = true;
  }

  if (changed) {
    scheduleBatchFlush();
  }
}

export function getItsmFindingCorrelationsSnapshot(findingId: string): ItsmFindingCorrelationsEntry {
  return getEntry(findingId);
}

export function subscribeItsmFindingCorrelations(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Marks one finding as stale and reloads it on the next request. */
export function invalidateItsmFindingCorrelations(findingId: string): void {
  entries.delete(findingId);
  pendingFindingIds.add(findingId);
  scheduleBatchFlush();
}

/** Clears cached correlation state (tests). */
export function resetItsmFindingCorrelationsStoreForTests(): void {
  entries.clear();
  pendingFindingIds.clear();
  listeners.clear();
  flushScheduled = false;
  inFlightBatch = undefined;
}
