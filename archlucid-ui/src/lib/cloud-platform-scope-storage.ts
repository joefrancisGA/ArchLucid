export type CloudPlatformId = "evidence-only" | "azure" | "aws" | "gcp";

/** Server-owned visibility flag — persisted for API parity but not exposed on Preferences UI. */
export type CloudProviderId = "azure" | "aws" | "gcp";

export type CloudPlatformScope = Readonly<Record<CloudPlatformId, boolean>>;

export const CLOUD_PROVIDER_NEUTRAL_ORDER: readonly CloudProviderId[] = ["aws", "azure", "gcp"];

export const CLOUD_PLATFORM_SCOPE_CHANGED_EVENT = "archlucid:cloud-platform-scope-changed";

export const CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE =
  "Saved on this device only. Account sync failed — check connectivity and try again.";

export const DEFAULT_CLOUD_PLATFORM_SCOPE: CloudPlatformScope = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
};

const PERSONAL_SCOPE_STORAGE_KEY = "archlucid.cloud-platform-scope.v1.personal";

function dispatchCloudPlatformScopeChanged(): void {
  window.dispatchEvent(new CustomEvent(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT));
}

function normalizeCloudPlatformScope(
  parsed: Partial<Record<CloudPlatformId, boolean>> | null | undefined,
): CloudPlatformScope {
  return {
    "evidence-only": parsed?.["evidence-only"] ?? true,
    azure: parsed?.azure ?? true,
    aws: parsed?.aws ?? true,
    gcp: parsed?.gcp ?? true,
  };
}

function scopesEqual(left: CloudPlatformScope, right: CloudPlatformScope): boolean {
  return (
    left["evidence-only"] === right["evidence-only"]
    && left.azure === right.azure
    && left.aws === right.aws
    && left.gcp === right.gcp
  );
}

/** Personal cloud-platform visibility for the signed-in user. */
export function resolveLandingCloudPlatformScope(): CloudPlatformScope {
  return readCloudPlatformScopeFromStorage();
}

export function readCloudPlatformScopeFromStorage(): CloudPlatformScope {
  if (typeof window === "undefined") {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }

  try {
    const raw = window.localStorage.getItem(PERSONAL_SCOPE_STORAGE_KEY);

    if (raw === null || raw.length === 0) {
      return DEFAULT_CLOUD_PLATFORM_SCOPE;
    }

    const parsed = JSON.parse(raw) as Partial<Record<CloudPlatformId, boolean>>;

    return normalizeCloudPlatformScope(parsed);
  } catch {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }
}

export function writeCloudPlatformScopeToStorage(scope: CloudPlatformScope): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PERSONAL_SCOPE_STORAGE_KEY, JSON.stringify(scope));
  dispatchCloudPlatformScopeChanged();
}

export function persistCloudPlatformScopeLocally(scope: CloudPlatformScope): void {
  writeCloudPlatformScopeToStorage(scope);
}

export async function syncCloudPlatformScopeFromServer(): Promise<CloudPlatformScope | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { fromCloudPlatformScopeDto, getUserPreferences, setUserCloudPlatformScope } = await import(
      "@/lib/api/user-preferences"
    );
    const remote = await getUserPreferences();
    const localScope = readCloudPlatformScopeFromStorage();

    if (!remote.cloudPlatformScopeIsExplicit && !scopesEqual(localScope, DEFAULT_CLOUD_PLATFORM_SCOPE)) {
      await setUserCloudPlatformScope(localScope);
      persistCloudPlatformScopeLocally(localScope);

      return localScope;
    }

    const normalized = fromCloudPlatformScopeDto(remote.cloudPlatformScope);

    persistCloudPlatformScopeLocally(normalized);

    return normalized;
  } catch {
    return null;
  }
}

export async function persistCloudPlatformScopeToServer(scope: CloudPlatformScope): Promise<boolean> {
  try {
    const { setUserCloudPlatformScope } = await import("@/lib/api/user-preferences");
    await setUserCloudPlatformScope(scope);

    return true;
  } catch {
    return false;
  }
}

export async function persistCloudPlatformScope(scope: CloudPlatformScope): Promise<boolean> {
  persistCloudPlatformScopeLocally(scope);

  return persistCloudPlatformScopeToServer(scope);
}

/** Clears personal scope between Vitest cases. */
export function resetCloudPlatformScopeSessionStateForTests(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PERSONAL_SCOPE_STORAGE_KEY);
}

export function visibleCloudProviders(scope: CloudPlatformScope): CloudProviderId[] {
  return CLOUD_PROVIDER_NEUTRAL_ORDER.filter((provider) => scope[provider]);
}

export function visibleLandingPlatformCards(scope: CloudPlatformScope): CloudProviderId[] {
  return visibleCloudProviders(scope);
}

export function subscribeCloudPlatformScopeChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => {
    onChange();
  };

  window.addEventListener(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT, handler);

  return () => {
    window.removeEventListener(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT, handler);
  };
}
