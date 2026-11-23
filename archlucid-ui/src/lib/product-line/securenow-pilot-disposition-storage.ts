import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export const SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX = "securenow-pilot-disposition:" as const;

export const SECURENOW_PILOT_DISPOSITION_STORAGE_DISCIPLINE =
  "Tenant audit is authoritative; this browser copy is a cache. It does not clear beta NO_GO." as const;

export const SECURENOW_PILOT_DISPOSITION_TENANT_AUDIT_SAVED_LINE =
  "Saved to tenant audit for this workspace." as const;

export type SecureNowPilotDispositionRecord = {
  readonly outcome: string;
  readonly rationale: string;
};

function dispositionScopeSegment(): string {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return "";
  }

  const tenantId = scope.tenantId.trim();
  const workspaceId = scope.workspaceId.trim();

  if (tenantId.length === 0 || workspaceId.length === 0) {
    return "";
  }

  return `${tenantId}:${workspaceId}:`;
}

export function secureNowPilotDispositionStorageKey(pathId: string): string {
  // The audit request is workspace-scoped. A path-only key shows another workspace's cache after a 404.
  return `${SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX}${dispositionScopeSegment()}${pathId.trim()}`;
}

export function readSecureNowPilotDisposition(pathId: string): SecureNowPilotDispositionRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedPathId = pathId.trim();

  if (trimmedPathId.length === 0) {
    return null;
  }

  try {
    const storage = window.localStorage;
    const key = secureNowPilotDispositionStorageKey(trimmedPathId);
    const stored = storage.getItem(key);

    if (stored === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as { outcome?: string; rationale?: string };
      const outcome = parsed.outcome?.trim() ?? "";
      const rationale = parsed.rationale?.trim() ?? "";

      return outcome && rationale ? { outcome, rationale } : null;
    } catch {
      storage.removeItem(key);
      return null;
    }
  } catch {
    return null;
  }
}

export function writeSecureNowPilotDisposition(
  pathId: string,
  record: SecureNowPilotDispositionRecord,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(secureNowPilotDispositionStorageKey(pathId), JSON.stringify(record));
  } catch {
    // The browser copy is optional. The tenant audit remains authoritative.
  }
}
