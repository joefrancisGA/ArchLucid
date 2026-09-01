import { beforeEach, describe, expect, it, vi } from "vitest";

import { syncArchitectureDraftRegistryForFinalizedReview } from "@/lib/architecture/architecture-draft-registry-finalize-sync";

const invalidateArchitectureDraftListQueries = vi.fn();

vi.mock("@/lib/architecture/architecture-draft-list-client", () => ({
  invalidateArchitectureDraftListQueries: () => invalidateArchitectureDraftListQueries(),
}));

describe("syncArchitectureDraftRegistryForFinalizedReview", () => {
  beforeEach(() => {
    invalidateArchitectureDraftListQueries.mockReset();
  });

  it("invalidates the server-backed draft inventory when a linked review finalizes", () => {
    syncArchitectureDraftRegistryForFinalizedReview("run-vertex");

    expect(invalidateArchitectureDraftListQueries).toHaveBeenCalledTimes(1);
  });

  it("ignores blank run ids", () => {
    syncArchitectureDraftRegistryForFinalizedReview("   ");

    expect(invalidateArchitectureDraftListQueries).not.toHaveBeenCalled();
  });
});
