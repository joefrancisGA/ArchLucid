import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSearchRecentQueries,
  readSearchRecentQueries,
  recordSearchRecentQuery,
} from "@/lib/search-recent-queries";

describe("search-recent-queries", () => {
  beforeEach(() => {
    clearSearchRecentQueries();
  });

  it("records up to three recent queries", () => {
    recordSearchRecentQuery("phi risk");
    recordSearchRecentQuery("claims service");
    recordSearchRecentQuery("policy rule");
    recordSearchRecentQuery("newest");

    expect(readSearchRecentQueries()).toEqual(["newest", "policy rule", "claims service"]);
  });

  it("dedupes case-insensitively", () => {
    recordSearchRecentQuery("PHI risk");
    recordSearchRecentQuery("phi risk");

    expect(readSearchRecentQueries()).toEqual(["phi risk"]);
  });
});
