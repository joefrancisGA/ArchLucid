import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import * as architectureRunsList from "@/lib/api/architecture-runs-list";
import { fetchPagedReviewsInventory } from "./reviews-paged-inventory";

describe("fetchPagedReviewsInventory", () => {
  beforeEach(() => {
    vi.spyOn(architectureRunsList, "listRunsByProjectPaged").mockResolvedValue({ items: [], totalCount: 0 });
    vi.spyOn(architectureRunsList, "listRunsInScopePaged").mockResolvedValue({ items: [], totalCount: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the project-slug list when an explicit project filter is set", async () => {
    await fetchPagedReviewsInventory({
      projectId: "claims-intake",
      page: 1,
      pageSize: 20,
      scopeHeaders: {},
    });

    expect(architectureRunsList.listRunsByProjectPaged).toHaveBeenCalledTimes(1);
    expect(architectureRunsList.listRunsInScopePaged).not.toHaveBeenCalled();
  });

  it("falls back to the project-slug list when scope-wide listing returns 404", async () => {
    vi.spyOn(architectureRunsList, "listRunsInScopePaged").mockRejectedValue(
      new ApiRequestError("missing", {
        httpStatus: 404,
        correlationId: null,
        problem: { status: 404, errorCode: "RESOURCE_NOT_FOUND" },
      }),
    );

    await fetchPagedReviewsInventory({
      projectId: "default",
      page: 1,
      pageSize: 20,
      scopeHeaders: { "X-ArchLucid-TenantId": "t1" },
    });

    expect(architectureRunsList.listRunsInScopePaged).toHaveBeenCalledTimes(1);
    expect(architectureRunsList.listRunsByProjectPaged).toHaveBeenCalledWith("default", 1, 20, {
      cursor: "",
      scopeHeaders: { "X-ArchLucid-TenantId": "t1" },
    });
  });

  it("rethrows non-404 scope-wide list failures", async () => {
    vi.spyOn(architectureRunsList, "listRunsInScopePaged").mockRejectedValue(
      new ApiRequestError("boom", {
        httpStatus: 500,
        correlationId: null,
        problem: { status: 500, errorCode: "INTERNAL_ERROR" },
      }),
    );

    await expect(
      fetchPagedReviewsInventory({
        projectId: "default",
        page: 1,
        pageSize: 20,
        scopeHeaders: {},
      }),
    ).rejects.toBeInstanceOf(ApiRequestError);

    expect(architectureRunsList.listRunsByProjectPaged).not.toHaveBeenCalled();
  });
});
