import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetItsmNativeCreateEnabledCacheForTests,
  resolveItsmNativeCreateReadiness,
} from "@/lib/itsm/itsm-native-integration";

const fetchItsmIntegrationHealth = vi.fn();
const fetchAzureBoardsHealth = vi.fn();
const fetchAzureBoardsSettings = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
}));

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsHealth: (...args: unknown[]) => fetchAzureBoardsHealth(...args),
  fetchAzureBoardsSettings: (...args: unknown[]) => fetchAzureBoardsSettings(...args),
  isAzureBoardsNativeCreateReady: () => false,
}));

describe("resolveItsmNativeCreateReadiness", () => {
  beforeEach(() => {
    resetItsmNativeCreateEnabledCacheForTests();
    fetchItsmIntegrationHealth.mockReset();
    fetchAzureBoardsHealth.mockReset();
    fetchAzureBoardsSettings.mockReset();
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { status: "healthy" },
      serviceNow: { status: "not_configured" },
    });
    fetchAzureBoardsHealth.mockResolvedValue({ status: "healthy" });
    fetchAzureBoardsSettings.mockResolvedValue({ defaultWorkItemType: "Task" });
  });

  it("deduplicates concurrent readiness resolutions", async () => {
    let resolveHealth: ((value: unknown) => void) | undefined;
    fetchItsmIntegrationHealth.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveHealth = resolve;
        }),
    );

    const first = resolveItsmNativeCreateReadiness();
    const second = resolveItsmNativeCreateReadiness();

    resolveHealth?.({
      nativeEnabled: false,
      jira: { status: "not_configured" },
      serviceNow: { status: "not_configured" },
    });

    await Promise.all([first, second]);

    expect(fetchItsmIntegrationHealth).toHaveBeenCalledTimes(1);
  });
});
