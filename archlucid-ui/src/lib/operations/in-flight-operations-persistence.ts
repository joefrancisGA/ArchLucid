import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { normalizeOperationState } from "@/lib/operations/operation-state";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";

const STORAGE_KEY_PREFIX = "archlucid_in_flight_operations_v1";

/**
 * Rows older than this are dropped on read so a long-abandoned tab cannot resurrect operations
 * that finished days ago and would poll a stale handle forever.
 */
export const IN_FLIGHT_OPERATION_MAX_PERSISTED_AGE_MS = 12 * 60 * 60 * 1000;

/**
 * Storage is namespaced by scope so switching tenant/workspace never surfaces another scope's
 * run ids in the shell — the same reason the proxy re-resolves scope headers per request.
 */
function resolveScopeNamespace(): string {
  const headers = getEffectiveBrowserProxyScopeHeaders();
  const tenantId = headers["x-tenant-id"] ?? "";
  const workspaceId = headers["x-workspace-id"] ?? "";
  const projectId = headers["x-project-id"] ?? "";

  return `${tenantId}|${workspaceId}|${projectId}`;
}

function resolveStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}:${resolveScopeNamespace()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Storage is user-writable, so every field is re-validated rather than trusted. */
function parsePersistedRow(raw: unknown, nowMs: number): TrackedInFlightOperation | null {
  if (!isRecord(raw)) {
    return null;
  }

  const operationId = readOptionalString(raw.operationId);
  const title = readOptionalString(raw.title);
  const href = readOptionalString(raw.href);

  if (operationId === null || title === null || href === null) {
    return null;
  }

  // Only same-origin relative paths — a persisted absolute URL would become an open-redirect
  // surface once the shell renders it as a link or assigns it to window.location.
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }

  const startedAtMs = typeof raw.startedAtMs === "number" ? raw.startedAtMs : Number.NaN;

  if (!Number.isFinite(startedAtMs) || nowMs - startedAtMs > IN_FLIGHT_OPERATION_MAX_PERSISTED_AGE_MS) {
    return null;
  }

  return {
    operationId,
    title,
    href,
    startedAtMs,
    stepLabel: readOptionalString(raw.stepLabel) ?? "Queued",
    state: normalizeOperationState(raw.state),
    runId: readOptionalString(raw.runId),
    terminalToastShown: raw.terminalToastShown === true,
  };
}

export function readPersistedInFlightOperations(): readonly TrackedInFlightOperation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const serialized = window.sessionStorage.getItem(resolveStorageKey());

    if (serialized === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const nowMs = Date.now();

    return parsed
      .map((row) => parsePersistedRow(row, nowMs))
      .filter((row): row is TrackedInFlightOperation => row !== null);
  } catch {
    return [];
  }
}

export function writePersistedInFlightOperations(
  operations: readonly TrackedInFlightOperation[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (operations.length === 0) {
      window.sessionStorage.removeItem(resolveStorageKey());

      return;
    }

    window.sessionStorage.setItem(resolveStorageKey(), JSON.stringify(operations));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Drops persisted rows for every scope — used on sign-out and scope switch. */
export function clearAllPersistedInFlightOperations(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.sessionStorage.length; index++) {
      const key = window.sessionStorage.key(index);

      if (key !== null && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore private mode */
  }
}
