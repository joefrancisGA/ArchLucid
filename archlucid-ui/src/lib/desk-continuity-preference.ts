import {
  defaultDeskContinuityDto,
  type DeskContinuityDto,
} from "@/lib/api/user-preferences-types";
import { readCachedUserPreferencesForMutators, setUserDeskContinuity } from "@/lib/api/user-preferences";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import {
  ARCHITECTURE_DRAFT_QUERY_PARAM,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";

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
  const nestedRoute = parseArchitectureNestedRoute(path);

  if (nestedRoute?.childKind === "reviews" && nestedRoute.childId !== undefined) {
    return nestedRoute.childId;
  }

  const match = new RegExp(`^${REVIEWS_LIST_PATH}/([^/]+)$`, "u").exec(path);

  if (match === null) {
    return null;
  }

  const runId = match[1]?.trim() ?? "";

  return runId.length > 0 ? runId : null;
}

export function extractArchitectureDraftIdFromPathname(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const nestedRoute = parseArchitectureNestedRoute(path);

  if (nestedRoute?.childKind === "drafts" && nestedRoute.childId !== undefined) {
    return nestedRoute.childId;
  }

  if (nestedRoute?.childKind === undefined && nestedRoute !== null) {
    return nestedRoute.architectureId;
  }

  return null;
}

const LAST_OPEN_ARCHITECTURE_ID_STORAGE_KEY = "archlucid.lastOpenArchitectureId.v1";

export function readCachedLastOpenArchitectureId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_OPEN_ARCHITECTURE_ID_STORAGE_KEY)?.trim() ?? "";

    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function writeCachedLastOpenArchitectureId(architectureId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const trimmed = architectureId?.trim() ?? "";

    if (trimmed.length === 0) {
      window.localStorage.removeItem(LAST_OPEN_ARCHITECTURE_ID_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(LAST_OPEN_ARCHITECTURE_ID_STORAGE_KEY, trimmed);
  } catch {
    /* private mode */
  }
}

/** Identity desk segment and nested architecture jobs (ADR 0077 / AO-16). */
export function extractArchitectureIdentityIdFromPathname(
  pathname: string,
  search: string,
): string | null {
  const path = pathname.split("?")[0] ?? "";
  const nestedRoute = parseArchitectureNestedRoute(path);

  if (nestedRoute !== null) {
    if (nestedRoute.childKind !== undefined) {
      return nestedRoute.architectureId;
    }

    const draftFromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
      ARCHITECTURE_DRAFT_QUERY_PARAM,
    )?.trim() ?? "";

    if (draftFromQuery.length > 0) {
      return null;
    }

    return nestedRoute.architectureId;
  }

  return null;
}
