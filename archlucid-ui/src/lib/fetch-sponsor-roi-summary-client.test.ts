import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchSponsorRoiSummaryCached,
  invalidateSponsorRoiSummaryCache,
} from "@/lib/fetch-sponsor-roi-summary-client";
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

describe("fetchSponsorRoiSummaryCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateSponsorRoiSummaryCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent reads into one network request", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          totalEstimatedUsdSavings: 1000,
          systemCount: 1,
          latestRunCount: 1,
          systems: [],
          topSystemicIssues: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchSponsorRoiSummaryCached(),
      fetchSponsorRoiSummaryCached(),
    ]);

    expect(first.totalEstimatedUsdSavings).toBe(1000);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
