import type { ArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";
import {
  architectureDraftDisplayName,
  customerFacingArchitectureDraftTitle,
} from "@/lib/architecture/architecture-draft-status";
import { architectureDraftSpawnedRunId, architectureDraftHasLinkedReview } from "@/lib/architecture/architecture-draft-handoff-gate";
import type { DraftRequestResponse, DraftRequestStatus } from "@/types/draft-intake";

const STORAGE_KEY = "archlucid_architecture_draft_registry_v1";

export type ArchitectureDraftRegistryEntry = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly customerStatus: ArchitectureDraftCustomerStatus;
  readonly ownerLabel: string;
  readonly lastUpdatedUtc: string;
  readonly linkedReviewId: string | null;
  readonly serverUpdatedUtc: string;
  /** Server lifecycle from the last registry upsert — drives home resume vs review routing. */
  readonly serverDraftStatus?: DraftRequestStatus;
};

type ArchitectureDraftRegistrySnapshot = {
  readonly entries: ArchitectureDraftRegistryEntry[];
};

function readSnapshot(): ArchitectureDraftRegistrySnapshot {
  if (typeof window === "undefined") {
    return { entries: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return { entries: [] };
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as ArchitectureDraftRegistrySnapshot).entries)
    ) {
      return { entries: [] };
    }

    return parsed as ArchitectureDraftRegistrySnapshot;
  } catch {
    return { entries: [] };
  }
}

function writeSnapshot(snapshot: ArchitectureDraftRegistrySnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  cachedArchitectureDraftRegistrySignature = "";
  notifyArchitectureDraftRegistryListeners();
}

const architectureDraftRegistryListeners = new Set<() => void>();

let cachedArchitectureDraftRegistrySnapshot: readonly ArchitectureDraftRegistryEntry[] = [];
let cachedArchitectureDraftRegistrySignature = "";

function architectureDraftRegistrySignature(entries: readonly ArchitectureDraftRegistryEntry[]): string {
  return entries
    .map(
      (entry) =>
        `${entry.architectureId}:${entry.lastUpdatedUtc}:${entry.customerStatus}:${entry.linkedReviewId ?? ""}:${entry.serverDraftStatus ?? ""}:${entry.displayName}:${entry.ownerLabel}`,
    )
    .join("|");
}

function notifyArchitectureDraftRegistryListeners(): void {
  for (const listener of architectureDraftRegistryListeners) {
    listener();
  }
}

/** `useSyncExternalStore` subscription for browser-local draft registry reads (TB-1450). */
export function subscribeArchitectureDraftRegistry(onStoreChange: () => void): () => void {
  architectureDraftRegistryListeners.add(onStoreChange);

  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    architectureDraftRegistryListeners.delete(onStoreChange);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

/** Stable snapshot for `useSyncExternalStore` — avoids rerender loops when data is unchanged. */
export function getArchitectureDraftRegistrySnapshot(): readonly ArchitectureDraftRegistryEntry[] {
  const next = listArchitectureDraftRegistryEntries();
  const nextSignature = architectureDraftRegistrySignature(next);

  if (nextSignature === cachedArchitectureDraftRegistrySignature) {
    return cachedArchitectureDraftRegistrySnapshot;
  }

  cachedArchitectureDraftRegistrySignature = nextSignature;
  cachedArchitectureDraftRegistrySnapshot = next;

  return cachedArchitectureDraftRegistrySnapshot;
}

/** SSR / hydration fallback for {@link getArchitectureDraftRegistrySnapshot}. */
export function getArchitectureDraftRegistryServerSnapshot(): readonly ArchitectureDraftRegistryEntry[] {
  return [];
}

export function listArchitectureDraftRegistryEntries(): ArchitectureDraftRegistryEntry[] {
  return readSnapshot()
    .entries.slice()
    .sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc))
    .map((entry) => ({
      ...entry,
      displayName: customerFacingArchitectureDraftTitle(entry.displayName, entry.lastUpdatedUtc),
    }));
}

export function upsertArchitectureDraftRegistryEntry(
  entry: ArchitectureDraftRegistryEntry,
): ArchitectureDraftRegistryEntry {
  const snapshot = readSnapshot();
  const nextEntries = snapshot.entries.filter((row) => row.architectureId !== entry.architectureId);
  nextEntries.unshift(entry);
  writeSnapshot({ entries: nextEntries });

  return entry;
}

export function removeArchitectureDraftRegistryEntry(architectureId: string): void {
  const snapshot = readSnapshot();
  writeSnapshot({
    entries: snapshot.entries.filter((row) => row.architectureId !== architectureId),
  });
}

function deriveRegistryCustomerStatus(
  draft: DraftRequestResponse,
  options: {
    readonly customerStatus?: ArchitectureDraftCustomerStatus;
    readonly linkedReviewId?: string | null;
  },
): ArchitectureDraftCustomerStatus {
  if (options.customerStatus === "archived") {
    return "archived";
  }

  const linkedReviewId = options.linkedReviewId ?? architectureDraftSpawnedRunId(draft);

  if (linkedReviewId !== null) {
    return "ready-for-review";
  }

  if (
    draft.status === "Admitted" ||
    draft.status === "Submitted" ||
    draft.status === "RunSpawned" ||
    draft.status === "Redirected"
  ) {
    return "ready-for-review";
  }

  return options.customerStatus ?? "draft";
}

export function buildArchitectureDraftRegistryEntry(
  draft: DraftRequestResponse,
  options: {
    readonly customerStatus?: ArchitectureDraftCustomerStatus;
    readonly ownerLabel?: string;
    readonly linkedReviewId?: string | null;
  } = {},
): ArchitectureDraftRegistryEntry {
  const linkedReviewId = options.linkedReviewId ?? architectureDraftSpawnedRunId(draft);

  return {
    architectureId: draft.draftId,
    displayName: architectureDraftDisplayName(draft.document.systemName, draft.document.freeTextIntent),
    customerStatus: deriveRegistryCustomerStatus(draft, options),
    ownerLabel: options.ownerLabel ?? "You",
    lastUpdatedUtc: draft.updatedUtc,
    linkedReviewId,
    serverUpdatedUtc: draft.updatedUtc,
    serverDraftStatus: draft.status,
  };
}

/** Drafts that still belong on home as unfinished architecture work (not archived, no spawned review). */
export function countUnlinkedArchitectureDraftRegistryEntries(
  entries: readonly ArchitectureDraftRegistryEntry[],
): number {
  return entries.filter(
    (entry) => entry.customerStatus !== "archived" && !architectureDraftHasLinkedReview(entry),
  ).length;
}
