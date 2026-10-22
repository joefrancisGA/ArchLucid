export const ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1 =
  "archlucid.architecture-draft-offline-queue.v1";

export const ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2 =
  "archlucid.architecture-draft-offline-queue.v2";

export const ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION = 2 as const;

export type ArchitectureDraftOfflineQueueEntry = {
  readonly draftId: string;
  readonly payloadJson: string;
  readonly queuedAtUtc: string;
  readonly expectedUpdatedUtc: string | null;
  readonly schemaVersion: typeof ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION;
};

type LegacyArchitectureDraftOfflineQueueEntry = {
  readonly architectureId?: string;
  readonly draftId?: string;
  readonly payloadJson: string;
  readonly queuedAtUtc: string;
  readonly expectedUpdatedUtc?: string | null;
  readonly schemaVersion?: number;
};

function normalizeEntry(entry: LegacyArchitectureDraftOfflineQueueEntry): ArchitectureDraftOfflineQueueEntry | null {
  const draftId = (entry.draftId ?? entry.architectureId ?? "").trim();

  if (draftId.length === 0) {
    return null;
  }

  const token = entry.expectedUpdatedUtc?.trim() ?? "";

  return {
    draftId,
    payloadJson: entry.payloadJson,
    queuedAtUtc: entry.queuedAtUtc,
    expectedUpdatedUtc: token.length > 0 ? token : null,
    schemaVersion: ARCHITECTURE_DRAFT_OFFLINE_QUEUE_SCHEMA_VERSION,
  };
}

function readRawQueue(key: string): LegacyArchitectureDraftOfflineQueueEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as LegacyArchitectureDraftOfflineQueueEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function readQueue(): ArchitectureDraftOfflineQueueEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const v2 = readRawQueue(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2).map(normalizeEntry);
  const v1 = readRawQueue(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1).map(normalizeEntry);
  const byDraftId = new Map<string, ArchitectureDraftOfflineQueueEntry>();

  for (const entry of [...v1, ...v2]) {
    if (entry === null) {
      continue;
    }

    byDraftId.set(entry.draftId, entry);
  }

  const merged = [...byDraftId.values()];

  if (merged.length > 0) {
    writeQueue(merged);
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1);
  }

  return merged;
}

function writeQueue(entries: readonly ArchitectureDraftOfflineQueueEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2, JSON.stringify(entries));
}

export function offlineQueueEntryHasCasToken(entry: ArchitectureDraftOfflineQueueEntry): boolean {
  return (entry.expectedUpdatedUtc?.trim() ?? "").length > 0;
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

  window.localStorage.removeItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V1);
  window.localStorage.removeItem(ARCHITECTURE_DRAFT_OFFLINE_QUEUE_KEY_V2);
}
