import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchTenantTrialStatusCached,
  invalidateTenantTrialStatusCache,
} from "@/lib/tenant-trial-status-client";
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

describe("fetchTenantTrialStatusCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateTenantTrialStatusCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent reads into one network request", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ status: "Active", daysRemaining: 10 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchTenantTrialStatusCached(),
      fetchTenantTrialStatusCached(),
    ]);

    expect(first).toEqual({ status: "Active", daysRemaining: 10 });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses cached payload within the TTL window", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ status: "Active", daysRemaining: 5 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await fetchTenantTrialStatusCached();
    await fetchTenantTrialStatusCached();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches when force is true", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ status: "Active", daysRemaining: 5 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await fetchTenantTrialStatusCached();
    await fetchTenantTrialStatusCached({ force: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
