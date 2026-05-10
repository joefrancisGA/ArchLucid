import { describe, expect, it } from "vitest";

import { DOCUMENTATION_SEARCH_ITEMS } from "./docs-search-index";

describe("docs-search-index", () => {
  it("indexes at least 25 curated operator docs", () => {
    expect(DOCUMENTATION_SEARCH_ITEMS.length).toBeGreaterThanOrEqual(25);
  });

  it("uses docs paths under docs/", () => {
    for (const row of DOCUMENTATION_SEARCH_ITEMS) {
      expect(row.relativeDocsPath.startsWith("docs/"), row.relativeDocsPath).toBe(true);
      expect(row.title.length).toBeGreaterThan(0);
      expect(row.category.length).toBeGreaterThan(0);
    }
  });
});
