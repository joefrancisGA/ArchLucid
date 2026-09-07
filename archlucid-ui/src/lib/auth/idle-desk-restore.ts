import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import {
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";
import { storePostSignInReturnUrl } from "@/lib/oidc/session";

/** Survives idle clear — separate from live operator scope storage (DR-12). */
export const IDLE_DESK_RESTORE_STORAGE_KEY = "archlucid.session.idleDeskRestore_v1" as const;

export type IdleDeskRestorePayload = {
  readonly returnPath: string;
  readonly scope: OperatorScopeRecord;
  readonly savedAtUtc: string;
};

function normalizeReturnPath(returnPath: string): string | null {
  const trimmed = returnPath.trim();

  if (!isSafeReturnPath(trimmed)) {
    return null;
  }

  return trimmed;
}

export function readIdleDeskRestorePayload(): IdleDeskRestorePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(IDLE_DESK_RESTORE_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<IdleDeskRestorePayload>;
    const returnPath = normalizeReturnPath(parsed.returnPath ?? "");

    if (returnPath === null) {
      return null;
    }

    const scope = parsed.scope;

    if (
      scope === null
      || scope === undefined
      || typeof scope.tenantId !== "string"
      || typeof scope.workspaceId !== "string"
      || typeof scope.projectId !== "string"
    ) {
      return null;
    }

    return {
      returnPath,
      scope: {
        tenantId: scope.tenantId.trim(),
        workspaceId: scope.workspaceId.trim(),
        projectId: scope.projectId.trim(),
        workspaceLabel: String(scope.workspaceLabel ?? "").trim(),
        projectLabel: String(scope.projectLabel ?? "").trim(),
      },
      savedAtUtc: String(parsed.savedAtUtc ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function clearIdleDeskRestorePayload(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(IDLE_DESK_RESTORE_STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
}

/** Copies operator scope + return path before idle/session clear wipes live desk state. */
export function persistIdleDeskRestoreBeforeSessionClear(returnPath: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const safeReturnPath = normalizeReturnPath(returnPath);

  if (safeReturnPath !== null) {
    storePostSignInReturnUrl(safeReturnPath);
  }

  const scope = readOperatorScopeFromStorage();

  if (scope === null || safeReturnPath === null) {
    return;
  }

  const payload: IdleDeskRestorePayload = {
    returnPath: safeReturnPath,
    scope,
    savedAtUtc: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(IDLE_DESK_RESTORE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** Restores workspace/project scope after re-auth; returns true when a payload was applied. */
export function restoreIdleDeskScopeAfterSignIn(): boolean {
  const payload = readIdleDeskRestorePayload();

  if (payload === null) {
    return false;
  }

  writeOperatorScopeToStorage(payload.scope);
  clearIdleDeskRestorePayload();

  return true;
}

export function consumeIdleDeskRestoreReturnPath(): string | null {
  const payload = readIdleDeskRestorePayload();
  const returnPath = payload?.returnPath ?? null;

  if (payload !== null) {
    clearIdleDeskRestorePayload();
  }

  return returnPath;
}
