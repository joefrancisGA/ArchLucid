export const SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY =
  "archlucid_settings_principal_continue_last_v1";

export type SettingsPrincipalContinueLastInput = {
  readonly id: string;
  readonly kind: "user" | "api_key";
  readonly name: string;
  readonly detail: string;
};

export type SettingsRolesContinueLastTarget = {
  readonly principalId: string;
  readonly kind: SettingsPrincipalContinueLastInput["kind"];
  readonly name: string;
};

function principalStorageKey(kind: SettingsPrincipalContinueLastInput["kind"], id: string): string {
  return `${kind}:${id}`;
}

function readStoredPrincipalKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeSettingsPrincipalLastViewedId(
  kind: SettingsPrincipalContinueLastInput["kind"],
  id: string,
): void {
  const normalizedId = id.trim();

  if (normalizedId.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY,
      principalStorageKey(kind, normalizedId),
    );
  } catch {
    /* ignore */
  }
}

function toTarget(row: SettingsPrincipalContinueLastInput): SettingsRolesContinueLastTarget {
  return {
    principalId: row.id,
    kind: row.kind,
    name: row.name.trim().length > 0 ? row.name : row.detail,
  };
}

/** Resolves the directory principal to pin as Continue last viewed. */
export function resolveContinueLastSettingsPrincipal(
  rows: readonly SettingsPrincipalContinueLastInput[],
): SettingsRolesContinueLastTarget | null {
  if (rows.length === 0) {
    return null;
  }

  const storedKey = readStoredPrincipalKey();

  if (storedKey !== null) {
    const storedMatch = rows.find((row) => principalStorageKey(row.kind, row.id) === storedKey);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const first = rows[0];

  return first === undefined ? null : toTarget(first);
}
