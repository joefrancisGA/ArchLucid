import { setUserWorkingWorkspaceContinuity } from "@/lib/api/user-preferences-working-workspace-continuity";
import type { WorkingWorkspaceContinuityDto } from "@/lib/api/user-preferences-types";
import {
  listFavoriteReviews,
  writeFavoriteReviews,
  type FavoriteReview,
} from "@/lib/favorite-reviews";
import {
  createEmptyRecentViewsState,
  persistRecentViewsState,
  readStoredRecentViewsState,
  type OperatorRecentViewEntry,
  type OperatorRecentViewsState,
} from "@/lib/operator/operator-recent-views";

export const WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY =
  "archlucid.workingWorkspaceContinuitySyncedAtUtc" as const;

function readLocalSyncedAtUtc(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY)?.trim();

    return raw !== undefined && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

function writeLocalSyncedAtUtc(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WORKING_WORKSPACE_CONTINUITY_SYNCED_AT_STORAGE_KEY, value);
  } catch {
    /* private mode */
  }
}

function toFavoriteReviewRows(
  rows: WorkingWorkspaceContinuityDto["favoriteReviews"],
): FavoriteReview[] {
  return rows
    .map((row) => {
      const runId = row.runId?.trim() ?? "";

      if (runId.length === 0) {
        return null;
      }

      const pinnedAt = row.pinnedAtUtc?.trim() ?? "";

      if (pinnedAt.length === 0) {
        return null;
      }

      const title = row.title?.trim();
      const architectureId = row.architectureId?.trim();

      if (title !== undefined && title.length > 0 && architectureId !== undefined && architectureId.length > 0) {
        return { runId, pinnedAt, title, architectureId };
      }

      if (title !== undefined && title.length > 0) {
        return { runId, pinnedAt, title };
      }

      if (architectureId !== undefined && architectureId.length > 0) {
        return { runId, pinnedAt, architectureId };
      }

      return { runId, pinnedAt };
    })
    .filter((row): row is FavoriteReview => row !== null);
}

function toRecentViewEntries(
  rows: WorkingWorkspaceContinuityDto["recentViewEntries"],
): OperatorRecentViewEntry[] {
  return rows
    .map((row) => {
      const href = row.href?.trim() ?? "";
      const label = row.label?.trim() ?? "";
      const visitedAtUtc = row.visitedAtUtc?.trim() ?? "";
      const kind = row.kind?.trim() ?? "page";

      if (href.length === 0 || label.length === 0 || visitedAtUtc.length === 0) {
        return null;
      }

      const architectureId = row.architectureId?.trim();
      const parentArchitectureId = row.parentArchitectureId?.trim();

      return {
        href,
        label,
        kind: kind as OperatorRecentViewEntry["kind"],
        visitedAtUtc,
        ...(architectureId !== undefined && architectureId.length > 0 ? { architectureId } : {}),
        ...(parentArchitectureId !== undefined && parentArchitectureId.length > 0
          ? { parentArchitectureId }
          : {}),
      };
    })
    .filter((entry): entry is OperatorRecentViewEntry => entry !== null);
}

export function buildWorkingWorkspaceContinuityPayload(): WorkingWorkspaceContinuityDto {
  const updatedAtUtc = new Date().toISOString();
  const recentState = readStoredRecentViewsState();

  return {
    favoriteReviews: listFavoriteReviews().map((row) => ({
      runId: row.runId,
      pinnedAtUtc: row.pinnedAt,
      ...(row.title !== undefined ? { title: row.title } : {}),
      ...(row.architectureId !== undefined ? { architectureId: row.architectureId } : {}),
    })),
    recentViewEntries: recentState.entries.map((entry) => ({
      href: entry.href,
      label: entry.label,
      kind: entry.kind,
      visitedAtUtc: entry.visitedAtUtc,
      ...(entry.architectureId !== undefined ? { architectureId: entry.architectureId } : {}),
      ...(entry.parentArchitectureId !== undefined
        ? { parentArchitectureId: entry.parentArchitectureId }
        : {}),
    })),
    updatedAtUtc,
  };
}

export function shouldHydrateWorkingWorkspaceContinuityFromServer(
  continuity: WorkingWorkspaceContinuityDto,
  isExplicit: boolean,
): boolean {
  if (!isExplicit) {
    return false;
  }

  const serverUpdatedAt = continuity.updatedAtUtc?.trim() ?? "";
  const localSyncedAt = readLocalSyncedAtUtc();

  if (localSyncedAt === null) {
    return true;
  }

  if (serverUpdatedAt.length === 0) {
    return true;
  }

  return Date.parse(serverUpdatedAt) >= Date.parse(localSyncedAt);
}

export function applyWorkingWorkspaceContinuityFromServer(
  continuity: WorkingWorkspaceContinuityDto,
): void {
  writeFavoriteReviews(toFavoriteReviewRows(continuity.favoriteReviews));
  const entries = toRecentViewEntries(continuity.recentViewEntries);
  const nextState: OperatorRecentViewsState =
    entries.length > 0
      ? { schemaVersion: 2, entries }
      : createEmptyRecentViewsState();

  persistRecentViewsState(nextState);

  const updatedAtUtc = continuity.updatedAtUtc?.trim();

  if (updatedAtUtc !== undefined && updatedAtUtc.length > 0) {
    writeLocalSyncedAtUtc(updatedAtUtc);
  }
}

/** IH-066 — account persist with localStorage cache; last PUT wins on the server. */
export async function persistWorkingWorkspaceContinuityToServer(): Promise<void> {
  const continuity = buildWorkingWorkspaceContinuityPayload();

  await setUserWorkingWorkspaceContinuity(continuity);

  if (continuity.updatedAtUtc !== undefined) {
    writeLocalSyncedAtUtc(continuity.updatedAtUtc);
  }
}
