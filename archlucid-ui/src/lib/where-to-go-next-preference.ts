export const WHERE_TO_GO_NEXT_STORAGE_KEY = "archlucid.where-to-go-next.v1.personal";

export const WHERE_TO_GO_NEXT_CHANGED_EVENT = "archlucid:where-to-go-next-changed";

export const WHERE_TO_GO_NEXT_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export const DEFAULT_WHERE_TO_GO_NEXT_ENABLED = true;

function dispatchWhereToGoNextChanged(): void {
  window.dispatchEvent(new CustomEvent(WHERE_TO_GO_NEXT_CHANGED_EVENT));
}

export function normalizeWhereToGoNextEnabled(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "true") {
    return true;
  }

  return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;
}

export function readWhereToGoNextEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;
  }

  try {
    return normalizeWhereToGoNextEnabled(window.localStorage.getItem(WHERE_TO_GO_NEXT_STORAGE_KEY));
  }
  catch {
    return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;
  }
}

export function writeWhereToGoNextEnabledToStorage(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WHERE_TO_GO_NEXT_STORAGE_KEY, enabled ? "true" : "false");
  dispatchWhereToGoNextChanged();
}

export function persistWhereToGoNextEnabledLocally(enabled: boolean): void {
  writeWhereToGoNextEnabledToStorage(enabled);
}

export async function syncWhereToGoNextEnabledFromServer(): Promise<boolean | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences, setUserWhereToGoNextEnabled } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const localEnabled = readWhereToGoNextEnabledFromStorage();

    if (
      !remote.whereToGoNextIsExplicit
      && localEnabled !== DEFAULT_WHERE_TO_GO_NEXT_ENABLED
    ) {
      await setUserWhereToGoNextEnabled(localEnabled);
      persistWhereToGoNextEnabledLocally(localEnabled);

      return localEnabled;
    }

    persistWhereToGoNextEnabledLocally(remote.whereToGoNextEnabled);

    return remote.whereToGoNextEnabled;
  }
  catch {
    return null;
  }
}

export async function persistWhereToGoNextEnabledToServer(enabled: boolean): Promise<boolean> {
  try {
    const { setUserWhereToGoNextEnabled } = await import("@/lib/api/user-preferences");
    await setUserWhereToGoNextEnabled(enabled);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistWhereToGoNextEnabled(enabled: boolean): Promise<boolean> {
  persistWhereToGoNextEnabledLocally(enabled);

  return persistWhereToGoNextEnabledToServer(enabled);
}

/** Clears personal preference between Vitest cases. */
export function resetWhereToGoNextSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WHERE_TO_GO_NEXT_STORAGE_KEY);
}

export function subscribeWhereToGoNextChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (): void => {
    onChange();
  };

  window.addEventListener(WHERE_TO_GO_NEXT_CHANGED_EVENT, handler);

  return (): void => {
    window.removeEventListener(WHERE_TO_GO_NEXT_CHANGED_EVENT, handler);
  };
}
