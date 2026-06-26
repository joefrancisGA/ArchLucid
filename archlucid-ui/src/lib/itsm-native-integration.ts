import { fetchItsmIntegrationHealth, type ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm-native-create-readiness";

export type ItsmNativeCreateReadiness = {
  deploymentEnabled: boolean;
  defaultPathReady: boolean;
  health: ItsmIntegrationHealthResponse | null;
};

let cachedReadiness: ItsmNativeCreateReadiness | undefined;

/** Resolves deployment flag + probe readiness for native create default path (TB-387 + Tier 2 #6). Fails closed on errors. */
export async function resolveItsmNativeCreateReadiness(): Promise<ItsmNativeCreateReadiness> {
  if (cachedReadiness !== undefined) {
    return cachedReadiness;
  }

  try {
    const health = await fetchItsmIntegrationHealth();
    const deploymentEnabled = health.nativeEnabled === true;
    const defaultPathReady = isItsmNativeCreateDefaultPathReady(health);

    cachedReadiness = {
      deploymentEnabled,
      defaultPathReady,
      health,
    };
  } catch {
    cachedReadiness = {
      deploymentEnabled: false,
      defaultPathReady: false,
      health: null,
    };
  }

  return cachedReadiness;
}

/** Resolves whether one-click Jira/ServiceNow create is the default operator path. Fails closed on errors. */
export async function resolveItsmNativeCreateEnabled(): Promise<boolean> {
  const readiness = await resolveItsmNativeCreateReadiness();

  return readiness.defaultPathReady;
}

/** Clears the module cache (tests). */
export function resetItsmNativeCreateEnabledCacheForTests(): void {
  cachedReadiness = undefined;
}
