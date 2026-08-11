import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  getEffectiveBrowserProxyScopeHeaders,
} from "@/lib/operator-scope-storage";

export type CloudPlatformId = "evidence-only" | "azure" | "aws" | "gcp";

export type CloudProviderId = "azure" | "aws" | "gcp";

export type CloudPlatformScope = Readonly<Record<CloudPlatformId, boolean>>;

export const CLOUD_PROVIDER_NEUTRAL_ORDER: readonly CloudProviderId[] = ["aws", "azure", "gcp"];

export const CLOUD_PLATFORM_SCOPE_CHANGED_EVENT = "archlucid:cloud-platform-scope-changed";

export const DEFAULT_CLOUD_PLATFORM_SCOPE: CloudPlatformScope = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
};

/**
 * When operator workspace is missing, localStorage persistence is deferred.
 * Keep a session copy so checkbox toggles still drive the landing card grid (TB-1139).
 */
let deferredScopeWithoutWorkspace: CloudPlatformScope | null = null;

function scopeStorageKey(workspaceId: string): string {
  return `archlucid.cloud-platform-scope.v1.${workspaceId.trim()}`;
}

function readWorkspaceIdForScope(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const workspaceId = getEffectiveBrowserProxyScopeHeaders()["x-workspace-id"]?.trim() ?? "";

  return workspaceId.length > 0 ? workspaceId : null;
}

/** True when platform-scope preferences can be persisted for the current operator workspace. */
export function hasCloudPlatformScopeWorkspace(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const headers = getEffectiveBrowserProxyScopeHeaders();
  const tenantId = headers["x-tenant-id"]?.trim() ?? "";
  const workspaceId = headers["x-workspace-id"]?.trim() ?? "";
  const projectId = headers["x-project-id"]?.trim() ?? "";

  return tenantId.length > 0 && workspaceId.length > 0 && projectId.length > 0;
}

/**
 * Landing filter scope: fail closed to all platforms when no workspace is selected (TB-1142).
 * Session-deferred writes (TB-1139) still flush when a workspace appears.
 */
export function resolveLandingCloudPlatformScope(): CloudPlatformScope {
  if (!hasCloudPlatformScopeWorkspace()) {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }

  return readCloudPlatformScopeFromStorage();
}

function dispatchCloudPlatformScopeChanged(): void {
  window.dispatchEvent(new CustomEvent(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT));
}

export function readCloudPlatformScopeFromStorage(): CloudPlatformScope {
  if (typeof window === "undefined") {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }

  const workspaceId = readWorkspaceIdForScope();

  if (workspaceId === null) {
    return deferredScopeWithoutWorkspace ?? DEFAULT_CLOUD_PLATFORM_SCOPE;
  }

  // Workspace just became available: seed empty storage from session toggles, then drop deferred
  // so logout cannot resurrect a stale filter (TB-1139 / Bugbot).
  if (deferredScopeWithoutWorkspace !== null) {
    const flushed = deferredScopeWithoutWorkspace;
    deferredScopeWithoutWorkspace = null;
    const existingRaw = window.localStorage.getItem(scopeStorageKey(workspaceId));

    if (existingRaw === null || existingRaw.length === 0) {
      window.localStorage.setItem(scopeStorageKey(workspaceId), JSON.stringify(flushed));

      return flushed;
    }
  }

  try {
    const raw = window.localStorage.getItem(scopeStorageKey(workspaceId));

    if (raw === null || raw.length === 0) {
      return DEFAULT_CLOUD_PLATFORM_SCOPE;
    }

    const parsed = JSON.parse(raw) as Partial<Record<CloudPlatformId, boolean>>;

    return {
      "evidence-only": parsed["evidence-only"] ?? true,
      azure: parsed.azure ?? true,
      aws: parsed.aws ?? true,
      gcp: parsed.gcp ?? true,
    };
  } catch {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }
}

export function writeCloudPlatformScopeToStorage(scope: CloudPlatformScope): void {
  if (typeof window === "undefined") {
    return;
  }

  const workspaceId = readWorkspaceIdForScope();

  if (workspaceId === null) {
    // Persist in session memory and notify subscribers — never silent no-op (TB-1139).
    deferredScopeWithoutWorkspace = scope;
    dispatchCloudPlatformScopeChanged();

    return;
  }

  deferredScopeWithoutWorkspace = null;
  window.localStorage.setItem(scopeStorageKey(workspaceId), JSON.stringify(scope));
  dispatchCloudPlatformScopeChanged();
}

/** Clears deferred no-workspace scope between Vitest cases. */
export function resetCloudPlatformScopeSessionStateForTests(): void {
  deferredScopeWithoutWorkspace = null;
}

export function visibleCloudProviders(scope: CloudPlatformScope): CloudProviderId[] {
  return CLOUD_PROVIDER_NEUTRAL_ORDER.filter((provider) => scope[provider]);
}

export function visibleLandingPlatformCards(scope: CloudPlatformScope): CloudPlatformId[] {
  const cards: CloudPlatformId[] = [];

  if (scope["evidence-only"]) {
    cards.push("evidence-only");
  }

  for (const provider of CLOUD_PROVIDER_NEUTRAL_ORDER) {
    if (scope[provider]) {
      cards.push(provider);
    }
  }

  return cards;
}

export function subscribeCloudPlatformScopeChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => {
    onChange();
  };

  window.addEventListener(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT, handler);
  window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handler);

  return () => {
    window.removeEventListener(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT, handler);
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, handler);
  };
}
