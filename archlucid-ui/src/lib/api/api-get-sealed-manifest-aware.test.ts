import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";

import { apiGet } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

vi.mock("./http", () => ({
  apiGet: vi.fn(),
}));

describe("apiGetSealedManifestAware", () => {
  it("preserves structured not-found errors for route-level recovery", async () => {
    const notFound = new ApiRequestError("Review not found.", {
      problem: { title: "Not found", status: 404 },
      correlationId: "test-correlation-id",
      httpStatus: 404,
    });
    vi.mocked(apiGet).mockRejectedValueOnce(notFound);

    await expect(apiGetSealedManifestAware("/missing-review")).rejects.toBe(notFound);
  });

  it("keeps formatting non-not-found failures", async () => {
    const conflict = new ApiRequestError("Manifest is sealed.", {
      problem: { title: "Conflict", detail: "Manifest is sealed.", status: 409 },
      correlationId: "test-correlation-id",
      httpStatus: 409,
    });
    vi.mocked(apiGet).mockRejectedValueOnce(conflict);

    await expect(apiGetSealedManifestAware("/sealed-review")).rejects.toThrow("Manifest is sealed.");
  });
});
