const OFFLINE_QUEUE_KEY = "archlucid.architecture-draft-offline-queue.v1";

export type ArchitectureDraftOfflineQueueEntry = {
  readonly draftId: string;
  readonly payloadJson: string;
  readonly queuedAtUtc: string;
};

type LegacyArchitectureDraftOfflineQueueEntry = {
  readonly architectureId?: string;
  readonly draftId?: string;
  readonly payloadJson: string;
  readonly queuedAtUtc: string;
};

function readQueue(): ArchitectureDraftOfflineQueueEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as LegacyArchitectureDraftOfflineQueueEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => ({
      draftId: entry.draftId ?? entry.architectureId ?? "",
      payloadJson: entry.payloadJson,
      queuedAtUtc: entry.queuedAtUtc,
    })).filter((entry) => entry.draftId.length > 0);
  }
  catch {
    return [];
  }
}

function writeQueue(entries: readonly ArchitectureDraftOfflineQueueEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(entries));
}

export function enqueueArchitectureDraftOfflinePatch(
  entry: ArchitectureDraftOfflineQueueEntry,
): void {
  const queue = readQueue().filter((row) => row.draftId !== entry.draftId);

  writeQueue([...queue, entry]);
}

export function dequeueArchitectureDraftOfflinePatch(
  draftId: string,
): ArchitectureDraftOfflineQueueEntry | null {
  const queue = readQueue();
  const match = queue.find((row) => row.draftId === draftId) ?? null;

  writeQueue(queue.filter((row) => row.draftId !== draftId));

  return match;
}

export function listArchitectureDraftOfflineQueue(): readonly ArchitectureDraftOfflineQueueEntry[] {
  return readQueue();
}

export function resetArchitectureDraftOfflineQueueForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
