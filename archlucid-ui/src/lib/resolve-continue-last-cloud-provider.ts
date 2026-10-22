import { cloudProviderDetailPath } from "@/lib/cloud-connections-paths";
import { CLOUD_PROVIDER_NEUTRAL_ORDER, type CloudProviderId } from "@/lib/cloud-platform-scope-storage";

export const CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY = "archlucid_cloud_provider_continue_last_v1";

export type CloudConnectionsContinueLastTarget = {
  readonly provider: CloudProviderId;
  readonly name: string;
  readonly href: string;
};

const PROVIDER_NAMES: Readonly<Record<CloudProviderId, string>> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

function isCloudProviderId(value: string): value is CloudProviderId {
  return value === "azure" || value === "aws" || value === "gcp";
}

function readStoredProviderId(): CloudProviderId | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return isCloudProviderId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeCloudProviderLastViewedId(provider: CloudProviderId): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CLOUD_PROVIDER_LAST_VIEWED_STORAGE_KEY, provider);
  } catch {
    /* ignore */
  }
}

function toTarget(provider: CloudProviderId): CloudConnectionsContinueLastTarget {
  return {
    provider,
    name: PROVIDER_NAMES[provider],
    href: cloudProviderDetailPath(provider),
  };
}

export type ResolveContinueLastCloudProviderInput = {
  readonly visibleProviders: readonly CloudProviderId[];
  readonly successfulPullByProvider: Readonly<Record<CloudProviderId, boolean>>;
};

/** Resolves the cloud provider to pin as Continue last viewed. */
export function resolveContinueLastCloudProvider(
  input: ResolveContinueLastCloudProviderInput,
): CloudConnectionsContinueLastTarget | null {
  if (input.visibleProviders.length === 0) {
    return null;
  }

  const visible = new Set(input.visibleProviders);
  const storedId = readStoredProviderId();

  if (storedId !== null && visible.has(storedId)) {
    return toTarget(storedId);
  }

  const firstSuccessfulPull = CLOUD_PROVIDER_NEUTRAL_ORDER.find(
    (provider) => visible.has(provider) && input.successfulPullByProvider[provider] === true,
  );

  if (firstSuccessfulPull !== undefined) {
    return toTarget(firstSuccessfulPull);
  }

  return null;
}
