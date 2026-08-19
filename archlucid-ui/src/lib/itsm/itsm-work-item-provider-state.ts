import type { ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import { isItsmProviderProbeReady } from "@/lib/itsm/itsm-native-create-readiness";

export type ItsmWorkItemProvider = "Jira" | "ServiceNow";

export type ItsmWorkItemProviderConnectionState =
  | "notConfigured"
  | "ready"
  | "invalidConnection"
  | "deploymentDisabled";

export type ItsmWorkItemProviderSnapshot = {
  readonly provider: ItsmWorkItemProvider;
  readonly state: ItsmWorkItemProviderConnectionState;
  readonly summary: string | null;
};

const PROVIDERS: readonly ItsmWorkItemProvider[] = ["Jira", "ServiceNow"];

function probeForProvider(
  health: ItsmIntegrationHealthResponse | null | undefined,
  provider: ItsmWorkItemProvider,
): ItsmIntegrationHealthResponse["jira"] | undefined {
  if (provider === "Jira") {
    return health?.jira;
  }

  return health?.serviceNow;
}

function resolveProviderState(
  health: ItsmIntegrationHealthResponse | null | undefined,
  provider: ItsmWorkItemProvider,
): ItsmWorkItemProviderSnapshot {
  if (health?.nativeEnabled !== true) {
    return {
      provider,
      state: "deploymentDisabled",
      summary: health?.status ?? null,
    };
  }

  const probe = probeForProvider(health, provider);

  if (probe?.locallyConfigured !== true) {
    return {
      provider,
      state: "notConfigured",
      summary: probe?.summary ?? null,
    };
  }

  if (isItsmProviderProbeReady(probe)) {
    return {
      provider,
      state: "ready",
      summary: probe.summary ?? null,
    };
  }

  return {
    provider,
    state: "invalidConnection",
    summary: probe.summary ?? null,
  };
}

/** Symmetric Jira / ServiceNow readiness derived from the ITSM health probe payload. */
export function resolveItsmWorkItemProviderSnapshots(
  health: ItsmIntegrationHealthResponse | null | undefined,
): readonly ItsmWorkItemProviderSnapshot[] {
  return PROVIDERS.map((provider) => resolveProviderState(health, provider));
}

export function isItsmWorkItemProviderConfigured(snapshot: ItsmWorkItemProviderSnapshot): boolean {
  return snapshot.state === "ready" || snapshot.state === "invalidConnection";
}

export function isItsmWorkItemProviderReady(snapshot: ItsmWorkItemProviderSnapshot): boolean {
  return snapshot.state === "ready";
}

export function configuredItsmWorkItemProviders(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): readonly ItsmWorkItemProviderSnapshot[] {
  return snapshots.filter(isItsmWorkItemProviderConfigured);
}

export function readyItsmWorkItemProviders(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): readonly ItsmWorkItemProviderSnapshot[] {
  return snapshots.filter(isItsmWorkItemProviderReady);
}

export function hasAnyItsmWorkItemProviderConfigured(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): boolean {
  return configuredItsmWorkItemProviders(snapshots).length > 0;
}

export function hasAnyItsmWorkItemProviderReady(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): boolean {
  return readyItsmWorkItemProviders(snapshots).length > 0;
}

/** When exactly one provider is configured, callers can skip the picker. */
export function selectSingleConfiguredItsmWorkItemProvider(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): ItsmWorkItemProvider | null {
  const configured = configuredItsmWorkItemProviders(snapshots);

  if (configured.length !== 1) {
    return null;
  }

  return configured[0]?.provider ?? null;
}

/** When exactly one provider is ready for native create, callers can default the dialog selection. */
export function selectSingleReadyItsmWorkItemProvider(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
): ItsmWorkItemProvider | null {
  const ready = readyItsmWorkItemProviders(snapshots);

  if (ready.length !== 1) {
    return null;
  }

  return ready[0]?.provider ?? null;
}

export function findItsmWorkItemProviderSnapshot(
  snapshots: readonly ItsmWorkItemProviderSnapshot[],
  provider: ItsmWorkItemProvider,
): ItsmWorkItemProviderSnapshot | null {
  return snapshots.find((entry) => entry.provider === provider) ?? null;
}

export function canNativeCreateWithItsmProvider(
  health: ItsmIntegrationHealthResponse | null | undefined,
  provider: ItsmWorkItemProvider,
): boolean {
  const snapshot = findItsmWorkItemProviderSnapshot(resolveItsmWorkItemProviderSnapshots(health), provider);

  return snapshot?.state === "ready";
}
