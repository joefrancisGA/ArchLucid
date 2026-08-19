import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSponsorRoiEnvironmentSavings } from "@/hooks/use-sponsor-roi-environment-savings-query";

describe("fetchSponsorRoiEnvironmentSavings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws on non-OK responses instead of returning an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );

    await expect(fetchSponsorRoiEnvironmentSavings()).rejects.toThrow(/HTTP 503/);
  });

  it("returns savings slices on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              savingsByEnvironment: [{ environment: "production", estimatedUsdSavings: 100 }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );

    await expect(fetchSponsorRoiEnvironmentSavings()).resolves.toEqual([
      { environment: "production", estimatedUsdSavings: 100 },
    ]);
  });
});
