import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildStaticFindPageSearchIndex,
  searchFindPageHelpEntries,
  searchFindPageIndex,
  searchGuidedLockedFindPageEntries,
} from "@/lib/find-page-search-index";
import { resolveGuidedPaletteLockedDestinations } from "@/lib/usability/guided-palette-locked-destinations";

const productLineState = vi.hoisted(() => ({
  current: "architecture" as "architecture" | "security",
}));

vi.mock("@/lib/product-line/resolve-product-line-id", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/product-line/resolve-product-line-id")>();

  return {
    ...actual,
    resolveProductLineIdFromEnv: () => productLineState.current,
  };
});

describe("find-page-search-index (TB-2364)", () => {
  afterEach(() => {
    productLineState.current = "architecture";
  });

  it("builds a static index from nav links, curated tasks, and palette actions", () => {
    const index = buildStaticFindPageSearchIndex();

    expect(index.length).toBeGreaterThan(0);
    expect(index.some((entry) => entry.source === "nav")).toBe(true);
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
    const query = "approval";
    const headerMatch = searchFindPageIndex(query, { limit: 1 })[0];
    const paletteMatch = searchFindPageIndex(query, { limit: 1 })[0];

    expect(headerMatch).toEqual(paletteMatch);
  });

  it("uses Teams instead of Microsoft Teams for the SecureNow nav label", () => {
    productLineState.current = "security";

    const teamsEntry = buildStaticFindPageSearchIndex().find((entry) => entry.href === "/integrations/teams");

    expect(teamsEntry?.label).toBe("Teams");
    expect(teamsEntry?.searchValue).toContain("Microsoft Teams");
  });

  it("surfaces Guided locked destinations with lock reasons when search matches (CD-08)", () => {
    const locked = resolveGuidedPaletteLockedDestinations();
    const matches = searchGuidedLockedFindPageEntries("sponsor report", locked);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.lockReason).toBeTruthy();
    expect(matches[0]?.href).toBe("/insights/sponsor-report");
  });
});
