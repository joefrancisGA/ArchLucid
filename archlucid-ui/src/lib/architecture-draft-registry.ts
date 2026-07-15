import type { ArchitectureDraftCustomerStatus } from "@/lib/architecture-draft-status";
import { architectureDraftDisplayName } from "@/lib/architecture-draft-status";
import { architectureDraftSpawnedRunId } from "@/lib/architecture-draft-handoff-gate";
import type { DraftRequestResponse } from "@/types/draft-intake";

const STORAGE_KEY = "archlucid_architecture_draft_registry_v1";

export type ArchitectureDraftRegistryEntry = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly customerStatus: ArchitectureDraftCustomerStatus;
  readonly ownerLabel: string;
  readonly lastUpdatedUtc: string;
  readonly linkedReviewId: string | null;
  readonly serverUpdatedUtc: string;
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
}

export function listArchitectureDraftRegistryEntries(): ArchitectureDraftRegistryEntry[] {
  return readSnapshot()
    .entries.slice()
    .sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc));
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

export function buildArchitectureDraftRegistryEntry(
  draft: DraftRequestResponse,
  options: {
    readonly customerStatus?: ArchitectureDraftCustomerStatus;
    readonly ownerLabel?: string;
    readonly linkedReviewId?: string | null;
  } = {},
): ArchitectureDraftRegistryEntry {
  return {
    architectureId: draft.draftId,
    displayName: architectureDraftDisplayName(draft.document.systemName, draft.document.freeTextIntent),
    customerStatus: options.customerStatus ?? "draft",
    ownerLabel: options.ownerLabel ?? "You",
    lastUpdatedUtc: draft.updatedUtc,
    linkedReviewId: options.linkedReviewId ?? architectureDraftSpawnedRunId(draft),
    serverUpdatedUtc: draft.updatedUtc,
  };
}
