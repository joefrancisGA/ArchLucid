import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

import {
  fetchRunsByProjectPagedCached,
  invalidateRunsByProjectPagedCache,
} from "@/lib/runs-by-project-paged-client";

describe("fetchRunsByProjectPagedCached", () => {
  beforeEach(async () => {
    resetOperatorQueryClientForTests();
    await invalidateRunsByProjectPagedCache();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ items: [], totalCount: 0 }),
        json: async () => ({ items: [], totalCount: 0 }),
      })),
    );
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
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
