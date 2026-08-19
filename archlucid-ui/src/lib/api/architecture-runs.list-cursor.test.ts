import { afterEach, describe, expect, it, vi } from "vitest";

import { listRunsByProjectPaged, listRunsInScopePaged } from "@/lib/api/architecture-runs";
import * as http from "@/lib/api/http";

describe("listRuns keyset cursor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always sends cursor and take for project paged lists, including empty cursor", async () => {
    const apiGet = vi.spyOn(http, "apiGet").mockResolvedValue({ items: [], totalCount: 0 });

    await listRunsByProjectPaged("default", 1, 20, { cursor: "" });

    expect(apiGet).toHaveBeenCalledTimes(1);
    const path = String(apiGet.mock.calls[0]?.[0] ?? "");
    expect(path).toContain("/v1/authority/projects/default/reviews?");
    expect(path).toContain("take=20");
    expect(path).toContain("cursor=");
    expect(path).not.toContain("page=");
    expect(path).not.toContain("pageSize=");
  });

  it("sends empty cursor when options omit cursor", async () => {
    const apiGet = vi.spyOn(http, "apiGet").mockResolvedValue({ items: [], totalCount: 0 });

    await listRunsInScopePaged(2, 15);

    const path = String(apiGet.mock.calls[0]?.[0] ?? "");
    expect(path).toContain("/v1/authority/reviews?");
    expect(path).toContain("take=15");
    expect(path).toMatch(/(?:^|[?&])cursor=(?:&|$)/);
  });

  it("forwards a non-empty cursor token", async () => {
    const apiGet = vi.spyOn(http, "apiGet").mockResolvedValue({ items: [], totalCount: 0 });

    await listRunsByProjectPaged("default", 1, 10, { cursor: "abc123" });

    const path = String(apiGet.mock.calls[0]?.[0] ?? "");
    expect(path).toContain("cursor=abc123");
    expect(path).toContain("take=10");
  });
});
