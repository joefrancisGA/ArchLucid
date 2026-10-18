import {
  fetchAzureBoardsSettings,
  isAzureBoardsNativeCreateReady,
  type AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";
import { fetchItsmIntegrationHealth, type ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm/itsm-native-create-readiness";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

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

type ItsmReadinessProbes = {
  readonly healthResult: PromiseSettledResult<ItsmIntegrationHealthResponse>;
  readonly azureSettingsResult: PromiseSettledResult<AzureBoardsOutboundSettingsResponse> | null;
};

const readinessCache = new Map<ProductLineId, ItsmNativeCreateReadiness>();
const readinessInFlight = new Map<ProductLineId, Promise<ItsmNativeCreateReadiness>>();

// Azure Boards settings are architecture-only. A Security caller is rejected with 403 by the product-line gate.
function shouldLoadAzureBoardsSettings(productLine: ProductLineId): boolean {
  return !isSecureNowProductLine(productLine);
}

function resolveAzureBoardsReady(
  deploymentEnabled: boolean,
  azureSettingsResult: PromiseSettledResult<AzureBoardsOutboundSettingsResponse> | null,
): boolean {
  if (!deploymentEnabled || azureSettingsResult === null || azureSettingsResult.status !== "fulfilled") {
    return false;
  }

  return isAzureBoardsNativeCreateReady(azureSettingsResult.value);
}

async function probeItsmNativeCreateReadiness(productLine: ProductLineId): Promise<ItsmReadinessProbes> {
  if (!shouldLoadAzureBoardsSettings(productLine)) {
    const [healthResult] = await Promise.allSettled([fetchItsmIntegrationHealth()]);

    return {
      healthResult,
      azureSettingsResult: null,
    };
  }

  const [healthResult, azureSettingsResult] = await Promise.allSettled([
    fetchItsmIntegrationHealth(),
    fetchAzureBoardsSettings(),
  ]);

  return {
    healthResult,
    azureSettingsResult,
  };
}

function readinessFromHealth(
  health: ItsmIntegrationHealthResponse,
  azureSettingsResult: PromiseSettledResult<AzureBoardsOutboundSettingsResponse> | null,
): ItsmNativeCreateReadiness {
  const deploymentEnabled = health.nativeEnabled === true;
  const azureBoardsReady = resolveAzureBoardsReady(deploymentEnabled, azureSettingsResult);
  const defaultPathReady =
    deploymentEnabled
    && (isItsmNativeCreateDefaultPathReady(health) || azureBoardsReady);

  return {
    deploymentEnabled,
    defaultPathReady,
    health,
    azureBoardsReady,
  };
}

function closedItsmNativeCreateReadiness(): ItsmNativeCreateReadiness {
  return {
    deploymentEnabled: false,
    defaultPathReady: false,
    health: null,
    azureBoardsReady: false,
  };
}

async function loadItsmNativeCreateReadiness(productLine: ProductLineId): Promise<ItsmNativeCreateReadiness> {
  try {
    const probes = await probeItsmNativeCreateReadiness(productLine);
    const health = probes.healthResult.status === "fulfilled" ? probes.healthResult.value : null;

    if (health === null) {
      const reason = probes.healthResult.status === "rejected"
        ? probes.healthResult.reason
        : new Error("itsm-health-unavailable");

      throw reason;
    }

    const readiness = readinessFromHealth(health, probes.azureSettingsResult);
    readinessCache.set(productLine, readiness);

    return readiness;
  } catch {
    const readiness = closedItsmNativeCreateReadiness();
    readinessCache.set(productLine, readiness);

    return readiness;
  }
}

/** Resolves deployment flag + probe readiness for native create default path (TB-387 + Tier 2 #6). Fails closed on errors. */
export async function resolveItsmNativeCreateReadiness(
  productLine: ProductLineId = resolveProductLineId(),
): Promise<ItsmNativeCreateReadiness> {
  const cached = readinessCache.get(productLine);

  if (cached !== undefined) {
    return cached;
  }

  const inFlight = readinessInFlight.get(productLine);

  if (inFlight !== undefined) {
    return inFlight;
  }

  const pending = loadItsmNativeCreateReadiness(productLine).finally(() => {
    readinessInFlight.delete(productLine);
  });
  readinessInFlight.set(productLine, pending);

  return pending;
}

/** Resolves whether one-click Jira/ServiceNow create is the default operator path. Fails closed on errors. */
export async function resolveItsmNativeCreateEnabled(): Promise<boolean> {
  const readiness = await resolveItsmNativeCreateReadiness();

  return readiness.defaultPathReady;
}

/** Clears the module cache (tests). */
export function resetItsmNativeCreateEnabledCacheForTests(): void {
  readinessCache.clear();
  readinessInFlight.clear();
}
