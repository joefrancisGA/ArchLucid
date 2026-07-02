import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import {
  fetchRunsByProjectPagedCached,
  invalidateRunsByProjectPagedCache,
} from "@/lib/runs-by-project-paged-client";

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: vi.fn(async () => ({ items: [], totalCount: 0 })),
}));

import { listRunsByProjectPaged } from "@/lib/api";

describe("fetchRunsByProjectPagedCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateRunsByProjectPagedCache();
    vi.mocked(listRunsByProjectPaged).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dedupes concurrent reads into one API call", async () => {
    const params = { projectId: "default", page: 1, pageSize: 5 };

    const [first, second] = await Promise.all([
      fetchRunsByProjectPagedCached(params),
      fetchRunsByProjectPagedCached(params),
    ]);

    expect(first).toEqual({ items: [], totalCount: 0 });
    expect(second).toEqual(first);
    expect(listRunsByProjectPaged).toHaveBeenCalledTimes(1);
  });
});
