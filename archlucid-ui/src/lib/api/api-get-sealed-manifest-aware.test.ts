import { describe, expect, it, vi } from "vitest";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

describe("apiGetSealedManifestAware", () => {
  it("preserves structured not-found errors for route-level recovery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Not found", status: 404 }), {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        }),
      ),
    );

    await expect(apiGetSealedManifestAware("/missing-review")).rejects.toMatchObject({
      httpStatus: 404,
    });

    vi.unstubAllGlobals();
  });

  it("keeps formatting non-not-found failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Conflict", detail: "Manifest is sealed.", status: 409 }), {
          status: 409,
          headers: { "content-type": "application/problem+json" },
        }),
      ),
    );

    await expect(apiGetSealedManifestAware("/sealed-review")).rejects.toThrow("Manifest is sealed.");

    vi.unstubAllGlobals();
  });
});
