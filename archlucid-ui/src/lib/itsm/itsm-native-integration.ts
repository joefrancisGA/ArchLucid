import { fetchItsmIntegrationHealth, type ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import {
  fetchAzureBoardsSettings,
  isAzureBoardsNativeCreateReady,
} from "@/lib/api/azure-boards-api";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm/itsm-native-create-readiness";

export type ItsmNativeCreateReadiness = {
  deploymentEnabled: boolean;
  defaultPathReady: boolean;
  health: ItsmIntegrationHealthResponse | null;
  azureBoardsReady: boolean;
};

export const INITIAL_ITSM_NATIVE_CREATE_READINESS: ItsmNativeCreateReadiness = {
  deploymentEnabled: false,
  defaultPathReady: false,
  health: null,
  azureBoardsReady: false,
};

let cachedReadiness: ItsmNativeCreateReadiness | undefined;
let inFlightReadiness: Promise<ItsmNativeCreateReadiness> | undefined;

async function loadItsmNativeCreateReadiness(): Promise<ItsmNativeCreateReadiness> {
  try {
    const [healthResult, azureSettingsResult] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchAzureBoardsSettings(),
    ]);
    const health = healthResult.status === "fulfilled" ? healthResult.value : null;

    if (health === null) {
      throw healthResult.status === "rejected" ? healthResult.reason : new Error("itsm-health-unavailable");
    }

    const deploymentEnabled = health.nativeEnabled === true;
    let azureBoardsReady = false;

    if (deploymentEnabled && azureSettingsResult.status === "fulfilled") {
      azureBoardsReady = isAzureBoardsNativeCreateReady(azureSettingsResult.value);
    }

    const defaultPathReady =
      deploymentEnabled
      && (isItsmNativeCreateDefaultPathReady(health) || azureBoardsReady);

    cachedReadiness = {
      deploymentEnabled,
      defaultPathReady,
      health,
      azureBoardsReady,
    };
  } catch {
    cachedReadiness = {
      deploymentEnabled: false,
      defaultPathReady: false,
      health: null,
      azureBoardsReady: false,
    };
  }

  return cachedReadiness;
}

/** Resolves deployment flag + probe readiness for native create default path (TB-387 + Tier 2 #6). Fails closed on errors. */
export async function resolveItsmNativeCreateReadiness(): Promise<ItsmNativeCreateReadiness> {
  if (cachedReadiness !== undefined) {
    return cachedReadiness;
  }

  if (inFlightReadiness === undefined) {
    inFlightReadiness = loadItsmNativeCreateReadiness().finally(() => {
      inFlightReadiness = undefined;
    });
  }

  return inFlightReadiness;
}

/** Resolves whether one-click Jira/ServiceNow create is the default operator path. Fails closed on errors. */
export async function resolveItsmNativeCreateEnabled(): Promise<boolean> {
  const readiness = await resolveItsmNativeCreateReadiness();

  return readiness.defaultPathReady;
}

/** Clears the module cache (tests). */
export function resetItsmNativeCreateEnabledCacheForTests(): void {
  cachedReadiness = undefined;
  inFlightReadiness = undefined;
}
