const OFFLINE_QUEUE_KEY = "archlucid.architecture-draft-offline-queue.v1";

export type ArchitectureDraftOfflineQueueEntry = {
  readonly architectureId: string;
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

    const parsed = JSON.parse(raw) as ArchitectureDraftOfflineQueueEntry[];

    return Array.isArray(parsed) ? parsed : [];
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
  const queue = readQueue().filter((row) => row.architectureId !== entry.architectureId);

  writeQueue([...queue, entry]);
}

export function dequeueArchitectureDraftOfflinePatch(
  architectureId: string,
): ArchitectureDraftOfflineQueueEntry | null {
  const queue = readQueue();
  const match = queue.find((row) => row.architectureId === architectureId) ?? null;

  writeQueue(queue.filter((row) => row.architectureId !== architectureId));

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
