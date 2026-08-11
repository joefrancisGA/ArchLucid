import { describe, expect, it, vi, afterEach } from "vitest";

import {
  OPERATOR_OFFLINE_RECONNECT_BODY,
  OPERATOR_OFFLINE_RECONNECT_RETRY_LABEL,
  OPERATOR_OFFLINE_RECONNECT_TITLE,
  readNavigatorOnline,
  retryOperatorOfflineConnection,
  shouldShowOperatorOfflineReconnectBanner,
} from "@/lib/operator-offline-reconnect";

describe("operator-offline-reconnect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exposes banner copy", () => {
    expect(OPERATOR_OFFLINE_RECONNECT_TITLE.length).toBeGreaterThan(0);
    expect(OPERATOR_OFFLINE_RECONNECT_BODY).toContain("offline");
    expect(OPERATOR_OFFLINE_RECONNECT_RETRY_LABEL).toBe("Retry");
  });

  it("shows banner only when offline", () => {
    expect(shouldShowOperatorOfflineReconnectBanner(true)).toBe(false);
    expect(shouldShowOperatorOfflineReconnectBanner(false)).toBe(true);
  });

  it("reads navigator.onLine when available", () => {
    vi.stubGlobal("navigator", { onLine: false });

    expect(readNavigatorOnline()).toBe(false);

    vi.stubGlobal("navigator", { onLine: true });

    expect(readNavigatorOnline()).toBe(true);
  });

  it("invalidates queries when a query client is available", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await expect(retryOperatorOfflineConnection({ invalidateQueries })).resolves.toBe("invalidated");
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("reloads when no query client is available", async () => {
    const reload = vi.fn();

    vi.stubGlobal("window", { location: { reload } });

    await expect(retryOperatorOfflineConnection(null)).resolves.toBe("reloaded");
    expect(reload).toHaveBeenCalledTimes(1);
  });
});