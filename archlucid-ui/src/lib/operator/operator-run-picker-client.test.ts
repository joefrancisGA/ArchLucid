import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(),
  listRunsInScopePaged: vi.fn(),
  shouldListReviewsAcrossProjectSlugs: vi.fn((projectId: string | null | undefined) => {
    const trimmed = projectId?.trim() ?? "";

    return trimmed.length === 0 || trimmed.toLowerCase() === "default";
  }),
}));

import { listRunsByProjectPaged, listRunsInScopePaged } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-request-error";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";

const mockListByProject = vi.mocked(listRunsByProjectPaged);
const mockListInScope = vi.mocked(listRunsInScopePaged);

describe("loadProjectRunsMergedWithDemoFallback", () => {
  const prevDemo = process.env.NEXT_PUBLIC_DEMO_MODE;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = prevDemo;
    vi.clearAllMocks();
  });

  it("returns API items when non-empty", async () => {
    mockListInScope.mockResolvedValue({
      items: [
        {
          runId: "11111111-1111-1111-1111-111111111111",
          projectId: "ArchLucid",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Alpha run",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default");

    expect(loadError).toBe(false);
    expect(items).toHaveLength(1);
    expect(items[0]?.runId).toBe("11111111-1111-1111-1111-111111111111");
    expect(mockListInScope).toHaveBeenCalledTimes(1);
    expect(mockListByProject).not.toHaveBeenCalled();
  });

  it("lists by project slug when projectId is not the default hub scope", async () => {
    mockListByProject.mockResolvedValue({
      items: [
        {
          runId: "22222222-2222-2222-2222-222222222222",
          projectId: "claims-intake",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Scoped run",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("claims-intake");

    expect(loadError).toBe(false);
    expect(items).toHaveLength(1);
    expect(mockListByProject).toHaveBeenCalledWith("claims-intake", 1, 50);
    expect(mockListInScope).not.toHaveBeenCalled();
  });

  it("falls back to project list when scope-wide list returns 404", async () => {
    mockListInScope.mockRejectedValue(
      new ApiRequestError("missing", {
        httpStatus: 404,
        correlationId: null,
        problem: { status: 404, errorCode: "RESOURCE_NOT_FOUND" },
      }),
    );
    mockListByProject.mockResolvedValue({
      items: [
        {
          runId: "33333333-3333-3333-3333-333333333333",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00.000Z",
          description: "Legacy host",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default");

    expect(loadError).toBe(false);
    expect(items).toHaveLength(1);
    expect(mockListByProject).toHaveBeenCalledWith("default", 1, 50);
  });

  it("injects single showcase row when list is empty and demo mode is on", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    mockListInScope.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default");

    expect(loadError).toBe(false);
    expect(items).toHaveLength(1);
    expect(items[0]?.runId).toBe("claims-intake-modernization");
  });

  it("prefers compare pair when forCompare and list is empty and demo mode is on", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    mockListInScope.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default", { forCompare: true });

    expect(loadError).toBe(false);
    expect(items).toHaveLength(2);
    expect(items.map((r) => r.runId)).toEqual(["claims-intake-run-v1", "claims-intake-run-v2"]);
  });

  it("returns empty list when API returns zero without explicit demo build flags", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    mockListInScope.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default");

    expect(loadError).toBe(false);
    expect(items).toEqual([]);
  });

  it("returns load error without demo merge when list throws and demo mode is off", async () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    mockListInScope.mockRejectedValue(new Error("network down"));

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default");

    expect(loadError).toBe(true);
    expect(items).toEqual([]);
  });

  it("honors mergeDemoOnEmpty=false even in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    mockListInScope.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default", {
      mergeDemoOnEmpty: false,
    });

    expect(loadError).toBe(false);
    expect(items).toEqual([]);
  });

  it("filters to committed runs when committedOnly is set", async () => {
    mockListInScope.mockResolvedValue({
      items: [
        {
          runId: "open-run",
          projectId: "ArchLucid",
          createdUtc: "2026-01-01T00:00:00.000Z",
          hasGoldenManifest: false,
        },
        {
          runId: "finalized-run",
          projectId: "ArchLucid",
          createdUtc: "2026-01-02T00:00:00.000Z",
          hasGoldenManifest: true,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const { items, loadError } = await loadProjectRunsMergedWithDemoFallback("default", {
      forCompare: true,
      committedOnly: true,
    });

    expect(loadError).toBe(false);
    expect(items.map((r) => r.runId)).toEqual(["finalized-run"]);
  });
});
