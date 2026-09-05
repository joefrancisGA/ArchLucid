import {
  defaultDeskContinuityDto,
  type DeskContinuityDto,
} from "@/lib/api/user-preferences-types";
import { readCachedUserPreferencesForMutators, setUserDeskContinuity } from "@/lib/api/user-preferences";

export type DeskContinuityPatch = {
  readonly lastOpenReviewId?: string | null;
  readonly lastOpenDraftId?: string | null;
  readonly lastVisitWatermarkUtc?: string | null;
};

function normalizeOptionalId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

export function mergeDeskContinuity(
  current: DeskContinuityDto,
  patch: DeskContinuityPatch,
): DeskContinuityDto {
  return {
    lastOpenReviewId:
      patch.lastOpenReviewId !== undefined
        ? normalizeOptionalId(patch.lastOpenReviewId)
        : normalizeOptionalId(current.lastOpenReviewId),
    lastOpenDraftId:
      patch.lastOpenDraftId !== undefined
        ? normalizeOptionalId(patch.lastOpenDraftId)
        : normalizeOptionalId(current.lastOpenDraftId),
    lastVisitWatermarkUtc:
      patch.lastVisitWatermarkUtc !== undefined
        ? normalizeOptionalId(patch.lastVisitWatermarkUtc)
        : normalizeOptionalId(current.lastVisitWatermarkUtc),
  };
}

export function readCachedDeskContinuity(): DeskContinuityDto {
  const prefs = readCachedUserPreferencesForMutators();

  if (!prefs.deskContinuityIsExplicit) {
    return defaultDeskContinuityDto();
  }

  return mergeDeskContinuity(defaultDeskContinuityDto(), prefs.deskContinuity);
}

/** Persists desk continuity to the server; localStorage recent views remain a cache only (IS-13). */
export async function persistDeskContinuityPatch(patch: DeskContinuityPatch): Promise<void> {
  const merged = mergeDeskContinuity(readCachedDeskContinuity(), patch);

  await setUserDeskContinuity(merged);
}

export function extractReviewIdFromPathname(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const match = /^\/architecture\/reviews\/([^/]+)$/u.exec(path);

  if (match === null) {
    return null;
  }

  const runId = match[1]?.trim() ?? "";

  return runId.length > 0 ? runId : null;
}

export function extractArchitectureDraftIdFromPathname(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const prefix = "/architecture/architectures/";

  if (!path.startsWith(prefix)) {
    return null;
  }

  const remainder = path.slice(prefix.length).trim();

  if (remainder.length === 0 || remainder === "new") {
    return null;
  }

  return remainder;
}
