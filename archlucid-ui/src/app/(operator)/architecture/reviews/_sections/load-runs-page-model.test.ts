import { beforeEach, describe, expect, it, vi } from "vitest";

import { listRunsByProjectPaged, listRunsInScopePaged, shouldListReviewsAcrossProjectSlugs } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";

import { fetchReviewsHubPagedInventory, formatRunsPageProjectTitle } from "./load-runs-page-model";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn(),
    listRunsInScopePaged: vi.fn(),
  };
});

describe("formatRunsPageProjectTitle", () => {
  it("labels the active project with a clear prefix", () => {
    expect(formatRunsPageProjectTitle("default")).toBe("Project: default");
    expect(formatRunsPageProjectTitle("claims-intake")).toBe("Project: claims-intake");
  });
});

describe("reviews hub project list mode", () => {
  it("uses scope-wide inventory for the default hub URL", () => {
    expect(shouldListReviewsAcrossProjectSlugs(undefined)).toBe(true);
    expect(shouldListReviewsAcrossProjectSlugs("default")).toBe(true);
  });

  it("keeps slug filtering when an explicit projectId is requested", () => {
    expect(shouldListReviewsAcrossProjectSlugs("ArchLucid")).toBe(false);
  });
});

describe("fetchReviewsHubPagedInventory", () => {
  beforeEach(() => {
    vi.mocked(listRunsByProjectPaged).mockReset();
    vi.mocked(listRunsInScopePaged).mockReset();
  });

  it("uses the project-slug list when an explicit project filter is set", async () => {
    vi.mocked(listRunsByProjectPaged).mockResolvedValue({ items: [], totalCount: 0 });

    await fetchReviewsHubPagedInventory({
      projectId: "claims-intake",
      page: 1,
      pageSize: 20,
      cursor: undefined,
      scopeHeaders: {},
      listAcrossProjectSlugs: false,
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

    await fetchReviewsHubPagedInventory({
      projectId: "default",
      page: 1,
      pageSize: 20,
      cursor: undefined,
      scopeHeaders: { "X-ArchLucid-TenantId": "t1" },
      listAcrossProjectSlugs: true,
    });

    expect(listRunsInScopePaged).toHaveBeenCalledTimes(1);
    // An absent cursor is normalized to the empty first-page cursor before the fallback call.
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
      fetchReviewsHubPagedInventory({
        projectId: "default",
        page: 1,
        pageSize: 20,
        cursor: undefined,
        scopeHeaders: {},
        listAcrossProjectSlugs: true,
      }),
    ).rejects.toBeInstanceOf(ApiRequestError);

    expect(listRunsByProjectPaged).not.toHaveBeenCalled();
  });
});
