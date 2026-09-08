import {
  type LivelihoodIdleFormSnapshot,
  collectRegisteredLivelihoodIdleFormSnapshots,
} from "@/lib/auth/livelihood-idle-form-snapshot";
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
  readonly formSnapshots?: Readonly<Record<string, LivelihoodIdleFormSnapshot>>;
};

function normalizeComparableReturnPath(returnPath: string): string | null {
  const trimmed = returnPath.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const url = new URL(trimmed, "http://localhost");

    return `${url.pathname}${url.search}`;
  } catch {
    return trimmed.startsWith("/") ? trimmed : null;
  }
}

function writeIdleDeskRestorePayload(payload: IdleDeskRestorePayload): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(IDLE_DESK_RESTORE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function parseIdleDeskFormSnapshots(
  raw: unknown,
): Readonly<Record<string, LivelihoodIdleFormSnapshot>> | undefined {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return undefined;
  }

  const entries = Object.entries(raw as Record<string, Partial<LivelihoodIdleFormSnapshot>>);
  const parsed: Record<string, LivelihoodIdleFormSnapshot> = {};

  for (const [key, snapshot] of entries) {
    if (snapshot === null || snapshot === undefined || typeof snapshot !== "object") {
      continue;
    }

    const surfaceId = String(snapshot.surfaceId ?? "").trim();
    const returnPath = String(snapshot.returnPath ?? "").trim();
    const entityKey = String(snapshot.entityKey ?? "").trim();
    const fields = snapshot.fields;

    if (surfaceId.length === 0 || returnPath.length === 0 || entityKey.length === 0) {
      continue;
    }

    if (fields === null || fields === undefined || typeof fields !== "object") {
      continue;
    }

    const normalizedFields: Record<string, string> = {};

    for (const [fieldKey, fieldValue] of Object.entries(fields)) {
      normalizedFields[fieldKey] = String(fieldValue ?? "");
    }

    parsed[key] = {
      surfaceId,
      returnPath,
      entityKey,
      fields: normalizedFields,
      savedAtUtc: String(snapshot.savedAtUtc ?? new Date().toISOString()),
    };
  }

  if (Object.keys(parsed).length === 0) {
    return undefined;
  }

  return parsed;
}

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
      formSnapshots: parseIdleDeskFormSnapshots(parsed.formSnapshots),
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

  const formSnapshots = collectRegisteredLivelihoodIdleFormSnapshots();
  const payload: IdleDeskRestorePayload = {
    returnPath: safeReturnPath,
    scope,
    savedAtUtc: new Date().toISOString(),
    ...(Object.keys(formSnapshots).length > 0 ? { formSnapshots } : {}),
  };

  writeIdleDeskRestorePayload(payload);
}

/** Rehydrates one guarded livelihood form after idle sign-in when the return path matches. */
export function consumeIdleDeskRestoreFormSnapshot(
  snapshotKey: string,
  currentReturnPath: string,
): LivelihoodIdleFormSnapshot | null {
  const payload = readIdleDeskRestorePayload();

  if (payload === null || payload.formSnapshots === undefined) {
    return null;
  }

  const snapshot = payload.formSnapshots[snapshotKey];

  if (snapshot === undefined) {
    return null;
  }

  const expectedPath = normalizeComparableReturnPath(payload.returnPath);
  const actualPath = normalizeComparableReturnPath(currentReturnPath);

  if (expectedPath === null || actualPath === null || expectedPath !== actualPath) {
    return null;
  }

  const remainingSnapshots = { ...payload.formSnapshots };
  delete remainingSnapshots[snapshotKey];

  if (Object.keys(remainingSnapshots).length === 0) {
    clearIdleDeskRestorePayload();

    return snapshot;
  }

  writeIdleDeskRestorePayload({
    returnPath: payload.returnPath,
    scope: payload.scope,
    savedAtUtc: payload.savedAtUtc,
    formSnapshots: remainingSnapshots,
  });

  return snapshot;
}

/** Restores workspace/project scope after re-auth; returns true when a payload was applied. */
export function restoreIdleDeskScopeAfterSignIn(): boolean {
  const payload = readIdleDeskRestorePayload();

  if (payload === null) {
    return false;
  }

  writeOperatorScopeToStorage(payload.scope);

  if (payload.formSnapshots !== undefined && Object.keys(payload.formSnapshots).length > 0) {
    writeIdleDeskRestorePayload({
      returnPath: payload.returnPath,
      scope: payload.scope,
      savedAtUtc: payload.savedAtUtc,
      formSnapshots: payload.formSnapshots,
    });
  } else {
    clearIdleDeskRestorePayload();
  }

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
