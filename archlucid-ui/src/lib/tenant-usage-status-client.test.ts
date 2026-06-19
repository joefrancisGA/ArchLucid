import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchTenantUsageStatusCached,
  invalidateTenantUsageStatusCache,
} from "@/lib/tenant-usage-status-client";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

describe("fetchTenantUsageStatusCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateTenantUsageStatusCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent reads into one network request", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ isTrial: false, commercialTier: "Team", seatsUsed: 4, seatsLimit: 5 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchTenantUsageStatusCached(),
      fetchTenantUsageStatusCached(),
    ]);

    expect(first?.commercialTier).toBe("Team");
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
