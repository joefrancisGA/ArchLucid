import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator-scope-storage";

export type CloudPlatformId = "evidence-only" | "azure" | "aws" | "gcp";

export type CloudProviderId = "azure" | "aws" | "gcp";

export type CloudPlatformScope = Readonly<Record<CloudPlatformId, boolean>>;

export const CLOUD_PROVIDER_NEUTRAL_ORDER: readonly CloudProviderId[] = ["aws", "azure", "gcp"];

export const CLOUD_PLATFORM_SCOPE_CHANGED_EVENT = "archlucid:cloud-platform-scope-changed";

const DEFAULT_CLOUD_PLATFORM_SCOPE: CloudPlatformScope = {
  "evidence-only": true,
  azure: true,
  aws: true,
  gcp: true,
};

function scopeStorageKey(workspaceId: string): string {
  return `archlucid.cloud-platform-scope.v1.${workspaceId.trim()}`;
}

function readWorkspaceIdForScope(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const workspaceId = scope.workspaceId.trim();

  return workspaceId.length > 0 ? workspaceId : null;
}

export function readCloudPlatformScopeFromStorage(): CloudPlatformScope {
  if (typeof window === "undefined") {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
  }

  const workspaceId = readWorkspaceIdForScope();

  if (workspaceId === null) {
    return DEFAULT_CLOUD_PLATFORM_SCOPE;
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
    return;
  }

  window.localStorage.setItem(scopeStorageKey(workspaceId), JSON.stringify(scope));
  window.dispatchEvent(new CustomEvent(CLOUD_PLATFORM_SCOPE_CHANGED_EVENT));
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
