import type { FindingsVisibilityPreferences } from "@/lib/api/user-preferences-types";

export const FINDINGS_VISIBILITY_STORAGE_KEY = "archlucid.findings-visibility.v1.personal";

export const FINDINGS_VISIBILITY_CHANGED_EVENT = "archlucid:findings-visibility-changed";

export const DEFAULT_FINDINGS_VISIBILITY_PREFERENCES: FindingsVisibilityPreferences = {
  hideGenericEnabled: false,
  showLowConfidenceEnabled: false,
  showAdvisoryEnabled: false,
};

function dispatchFindingsVisibilityChanged(): void {
  window.dispatchEvent(new CustomEvent(FINDINGS_VISIBILITY_CHANGED_EVENT));
}

function normalizeBooleanFlag(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = value.trim().toLowerCase();

  return trimmed === "true" || trimmed === "1";
}

export function readFindingsVisibilityFromStorage(): FindingsVisibilityPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_FINDINGS_VISIBILITY_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(FINDINGS_VISIBILITY_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return DEFAULT_FINDINGS_VISIBILITY_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<FindingsVisibilityPreferences>;

    return {
      hideGenericEnabled: parsed.hideGenericEnabled === true,
      showLowConfidenceEnabled: parsed.showLowConfidenceEnabled === true,
      showAdvisoryEnabled: parsed.showAdvisoryEnabled === true,
    };
  }
  catch {
    return DEFAULT_FINDINGS_VISIBILITY_PREFERENCES;
  }
}

export function writeFindingsVisibilityToStorage(preferences: FindingsVisibilityPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FINDINGS_VISIBILITY_STORAGE_KEY, JSON.stringify(preferences));
  dispatchFindingsVisibilityChanged();
}

export function findingsVisibilityFromUserPreferencesResponse(
  remote: {
    readonly findingsHideGenericEnabled: boolean;
    readonly findingsHideGenericEnabledIsExplicit: boolean;
    readonly findingsShowLowConfidenceEnabled: boolean;
    readonly findingsShowLowConfidenceEnabledIsExplicit: boolean;
    readonly findingsShowAdvisoryEnabled: boolean;
    readonly findingsShowAdvisoryEnabledIsExplicit: boolean;
  },
): FindingsVisibilityPreferences {
  return {
    hideGenericEnabled: remote.findingsHideGenericEnabled,
    showLowConfidenceEnabled: remote.findingsShowLowConfidenceEnabled,
    showAdvisoryEnabled: remote.findingsShowAdvisoryEnabled,
  };
}

export function hasExplicitFindingsVisibilityOnServer(
  remote: {
    readonly findingsHideGenericEnabledIsExplicit: boolean;
    readonly findingsShowLowConfidenceEnabledIsExplicit: boolean;
    readonly findingsShowAdvisoryEnabledIsExplicit: boolean;
  },
): boolean {
  return (
    remote.findingsHideGenericEnabledIsExplicit
    || remote.findingsShowLowConfidenceEnabledIsExplicit
    || remote.findingsShowAdvisoryEnabledIsExplicit
  );
}

export async function syncFindingsVisibilityFromServer(): Promise<FindingsVisibilityPreferences | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getUserPreferences } = await import("@/lib/api/user-preferences");
    const remote = await getUserPreferences();
    const remotePreferences = findingsVisibilityFromUserPreferencesResponse(remote);

    if (hasExplicitFindingsVisibilityOnServer(remote)) {
      writeFindingsVisibilityToStorage(remotePreferences);

      return remotePreferences;
    }

    return readFindingsVisibilityFromStorage();
  }
  catch {
    return null;
  }
}

export async function persistFindingsVisibilityToServer(
  preferences: FindingsVisibilityPreferences,
): Promise<boolean> {
  try {
    const { setUserFindingsVisibilityPreferences } = await import("@/lib/api/user-preferences");
    await setUserFindingsVisibilityPreferences(preferences);

    return true;
  }
  catch {
    return false;
  }
}

export async function persistFindingsVisibilityPreferences(
  preferences: FindingsVisibilityPreferences,
): Promise<boolean> {
  writeFindingsVisibilityToStorage(preferences);

  return persistFindingsVisibilityToServer(preferences);
}

/** Clears personal preference between Vitest cases. */
export function resetFindingsVisibilitySessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FINDINGS_VISIBILITY_STORAGE_KEY);
}

export function subscribeFindingsVisibilityChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (): void => {
    onChange();
  };

  window.addEventListener(FINDINGS_VISIBILITY_CHANGED_EVENT, handler);

  return (): void => {
    window.removeEventListener(FINDINGS_VISIBILITY_CHANGED_EVENT, handler);
  };
}

export function resolveFindingsVisibilityFlag(
  urlHasParam: boolean,
  urlValue: boolean,
  accountValue: boolean,
): boolean {
  if (urlHasParam) {
    return urlValue;
  }

  return accountValue;
}

export function parseStoredFindingsVisibilityFlag(raw: string | null | undefined): boolean {
  return normalizeBooleanFlag(raw);
}
