import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetItsmNativeCreateEnabledCacheForTests,
  resolveItsmNativeCreateReadiness,
} from "@/lib/itsm/itsm-native-integration";

const fetchItsmIntegrationHealth = vi.fn();
const fetchAzureBoardsSettings = vi.fn();

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => fetchItsmIntegrationHealth(...args),
}));

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsSettings: (...args: unknown[]) => fetchAzureBoardsSettings(...args),
  isAzureBoardsNativeCreateReady: () => false,
}));

describe("resolveItsmNativeCreateReadiness", () => {
  beforeEach(() => {
    resetItsmNativeCreateEnabledCacheForTests();
    fetchItsmIntegrationHealth.mockReset();
    fetchAzureBoardsSettings.mockReset();
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { status: "healthy" },
      serviceNow: { status: "not_configured" },
    });
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

  it("skips Azure Boards settings on the Security product line", async () => {
    fetchItsmIntegrationHealth.mockResolvedValue({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { status: "not_configured" },
    });

    const readiness = await resolveItsmNativeCreateReadiness("security");

    expect(fetchItsmIntegrationHealth).toHaveBeenCalledTimes(1);
    expect(fetchAzureBoardsSettings).not.toHaveBeenCalled();
    expect(readiness.azureBoardsReady).toBe(false);
    expect(readiness.defaultPathReady).toBe(true);
  });

  it("still fetches Azure Boards settings on the Architecture product line", async () => {
    const readiness = await resolveItsmNativeCreateReadiness("architecture");

    expect(fetchItsmIntegrationHealth).toHaveBeenCalledTimes(1);
    expect(fetchAzureBoardsSettings).toHaveBeenCalledTimes(1);
    expect(readiness.azureBoardsReady).toBe(false);
  });
});
