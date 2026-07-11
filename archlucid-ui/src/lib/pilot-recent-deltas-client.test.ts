import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchPilotRecentDeltasCached,
  invalidatePilotRecentDeltasCache,
} from "@/lib/pilot-recent-deltas-client";
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

describe("fetchPilotRecentDeltasCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidatePilotRecentDeltasCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent reads into one network request", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ items: [], requestedCount: 5, returnedCount: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchPilotRecentDeltasCached(5),
      fetchPilotRecentDeltasCached(5),
    ]);

    expect(first?.returnedCount).toBe(2);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
