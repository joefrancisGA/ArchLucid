import { readArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
} from "@/lib/operator/operator-recent-views";

const ARCHITECTURE_DRAFT_PATH_PREFIX = "/architecture/architectures/";

function isContinuableArchitectureDraftEntry(entry: ArchitectureDraftRegistryEntry): boolean {
  return entry.customerStatus !== "archived";
}

function architectureIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";
  const prefix = ARCHITECTURE_DRAFT_PATH_PREFIX;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const remainder = path.slice(prefix.length).trim();

  if (remainder.length === 0 || remainder === "new") {
    return null;
  }

  return remainder;
}

function readRecentArchitectureDraftId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const architectureId = architectureIdFromRecentHref(entry.href);

      if (architectureId !== null) {
        return architectureId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the draft row to pin as Continue last draft on the architectures list. */
export function resolveContinueLastArchitectureDraftEntry(
  entries: readonly ArchitectureDraftRegistryEntry[],
  serverLastOpenDraftId?: string | null,
): ArchitectureDraftRegistryEntry | null {
  if (entries.length === 0) {
    return null;
  }

  const trimmedServerDraftId = serverLastOpenDraftId?.trim() ?? "";

  if (trimmedServerDraftId.length > 0) {
    const serverMatch = entries.find(
      (entry) => entry.draftId === trimmedServerDraftId && isContinuableArchitectureDraftEntry(entry),
    );

    if (serverMatch !== undefined) {
      return serverMatch;
    }
  }

  const sessionDraftId = readArchitectureCreationDraftId();
  const recentDraftId = readRecentArchitectureDraftId();
  const preferredIds = [sessionDraftId, recentDraftId].filter((id): id is string => id !== null && id.length > 0);

  for (const preferredId of preferredIds) {
    const match = entries.find(
      (entry) => entry.draftId === preferredId && isContinuableArchitectureDraftEntry(entry),
    );

    if (match !== undefined) {
      return match;
    }
  }

  const draftEntries = entries.filter(
    (entry) => entry.customerStatus === "draft" && isContinuableArchitectureDraftEntry(entry),
  );

  if (draftEntries.length === 0) {
    return null;
  }

  return draftEntries
    .slice()
    .sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc))[0] ?? null;
}
