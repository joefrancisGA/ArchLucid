import { apiGet } from "@/lib/api-client";
import type { components } from "@/lib/openapi-schemas";

export type ItsmIntegrationHealthResponse = components["schemas"]["ItsmIntegrationHealthResponse"] & {
  nativeEnabled?: boolean;
};

let cachedNativeCreateEnabled: boolean | undefined;

/** Resolves whether one-click Jira/ServiceNow create is enabled (TB-387). Fails closed on errors. */
export async function resolveItsmNativeCreateEnabled(): Promise<boolean> {
  if (cachedNativeCreateEnabled !== undefined) {
    return cachedNativeCreateEnabled;
  }

  try {
    const health = await apiGet<ItsmIntegrationHealthResponse>("/v1/integrations/itsm/health");
    cachedNativeCreateEnabled = health.nativeEnabled === true;
  } catch {
    cachedNativeCreateEnabled = false;
  }

  return cachedNativeCreateEnabled;
}

/** Clears the module cache (tests). */
export function resetItsmNativeCreateEnabledCacheForTests(): void {
  cachedNativeCreateEnabled = undefined;
}
