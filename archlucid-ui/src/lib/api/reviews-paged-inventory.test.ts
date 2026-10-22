import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";

vi.mock("./architecture-runs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./architecture-runs")>();

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn(),
    listRunsInScopePaged: vi.fn(),
  };
});

import { listRunsByProjectPaged, listRunsInScopePaged } from "./architecture-runs";
import { fetchPagedReviewsInventory } from "./reviews-paged-inventory";

describe("fetchPagedReviewsInventory", () => {
  beforeEach(() => {
    vi.mocked(listRunsByProjectPaged).mockReset();
    vi.mocked(listRunsInScopePaged).mockReset();
  });

  it("uses the project-slug list when an explicit project filter is set", async () => {
    vi.mocked(listRunsByProjectPaged).mockResolvedValue({ items: [], totalCount: 0 });

    await fetchPagedReviewsInventory({
      projectId: "claims-intake",
      page: 1,
      pageSize: 20,
      scopeHeaders: {},
    });

    expect(listRunsByProjectPaged).toHaveBeenCalledTimes(1);
    expect(listRunsInScopePaged).not.toHaveBeenCalled();
  });

  it("falls back to the project-slug list when scope-wide listing returns 404", async () => {
    vi.mocked(listRunsInScopePaged).mockRejectedValue(
      new ApiRequestError("missing", {
        httpStatus: 404,
        correlationId: null,
        problem: { status: 404, errorCode: "RESOURCE_NOT_FOUND" },
      }),
    );
    vi.mocked(listRunsByProjectPaged).mockResolvedValue({ items: [], totalCount: 0 });

    await fetchPagedReviewsInventory({
      projectId: "default",
      page: 1,
      pageSize: 20,
      scopeHeaders: { "X-ArchLucid-TenantId": "t1" },
    });

    expect(listRunsInScopePaged).toHaveBeenCalledTimes(1);
    expect(listRunsByProjectPaged).toHaveBeenCalledWith("default", 1, 20, {
      cursor: "",
      scopeHeaders: { "X-ArchLucid-TenantId": "t1" },
    });
  });

  it("rethrows non-404 scope-wide list failures", async () => {
    vi.mocked(listRunsInScopePaged).mockRejectedValue(
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

    expect(listRunsByProjectPaged).not.toHaveBeenCalled();
  });
});
