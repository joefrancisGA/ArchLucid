import { describe, expect, it } from "vitest";

import {
  buildStaticFindPageSearchIndex,
  searchFindPageHelpEntries,
  searchFindPageIndex,
} from "@/lib/find-page-search-index";

describe("find-page-search-index (TB-2364)", () => {
  it("builds a static index from curated tasks and palette actions", () => {
    const index = buildStaticFindPageSearchIndex();

    expect(index.length).toBeGreaterThan(0);
    expect(index.some((entry) => entry.source === "curated")).toBe(true);
    expect(index.some((entry) => entry.source === "action")).toBe(true);
    expect(new Set(index.map((entry) => entry.id)).size).toBe(index.length);
  });

  it("returns ranked matches for a fixture query", () => {
    const matches = searchFindPageIndex("architecture reviews", { limit: 5 });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((entry) => entry.href.startsWith("/"))).toBe(true);
  });

  it("returns empty results for blank queries", () => {
    expect(searchFindPageIndex("   ")).toEqual([]);
  });

  it("maps help topics into the shared find-page entry shape", () => {
    const helpEntries = searchFindPageHelpEntries("review", { limit: 2 });

    expect(helpEntries.every((entry) => entry.source === "help")).toBe(true);
    expect(helpEntries.every((entry) => entry.href.startsWith("/help/"))).toBe(true);
  });

  it("surfaces the same top static match for header and palette consumers", () => {
    const query = "governance approval";
    const headerMatch = searchFindPageIndex(query, { limit: 1 })[0];
    const paletteMatch = searchFindPageIndex(query, { limit: 1 })[0];

    expect(headerMatch).toEqual(paletteMatch);
  });
});
