import { beforeEach, describe, expect, it, vi } from "vitest";

import { shouldListReviewsAcrossProjectSlugs } from "@/lib/api";

vi.mock("@/lib/api/reviews-paged-inventory", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/reviews-paged-inventory")>();

  return {
    ...actual,
    fetchPagedReviewsInventory: vi.fn(),
  };
});

import { fetchPagedReviewsInventory } from "@/lib/api/reviews-paged-inventory";

import { fetchReviewsHubPagedInventory, formatRunsPageProjectTitle } from "./load-runs-page-model";

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
    vi.mocked(fetchPagedReviewsInventory).mockReset();
  });

  it("delegates to fetchPagedReviewsInventory with the hub request shape", async () => {
    vi.mocked(fetchPagedReviewsInventory).mockResolvedValue({ items: [], totalCount: 0 });

    await fetchReviewsHubPagedInventory({
      projectId: "claims-intake",
      page: 1,
      pageSize: 20,
      cursor: undefined,
      scopeHeaders: { "x-tenant-id": "t1" },
      listAcrossProjectSlugs: false,
    });

    expect(fetchPagedReviewsInventory).toHaveBeenCalledWith({
      projectId: "claims-intake",
      page: 1,
      pageSize: 20,
      cursor: undefined,
      scopeHeaders: { "x-tenant-id": "t1" },
    });
  });
});
