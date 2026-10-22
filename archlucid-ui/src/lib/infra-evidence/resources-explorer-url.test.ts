import { describe, expect, it } from "vitest";

import {
  encodeResourcesExplorerSavedViewSort,
  formatResourcesExplorerPageRangeLabel,
  parseResourceExplorerPageFromSearch,
  parseResourcesExplorerSavedViewSort,
  resourceExplorerListStateHrefFromSearch,
} from "@/lib/infra-evidence/resources-explorer-url";

describe("resources-explorer-url", () => {
  it("parses page and builds list state href", () => {
    expect(parseResourceExplorerPageFromSearch("2")).toBe(2);
    expect(parseResourceExplorerPageFromSearch("0")).toBe(1);

    expect(
      resourceExplorerListStateHrefFromSearch("namePrefix=app", { page: 2 }, "/infrastructure/resources"),
    ).toBe("/infrastructure/resources?namePrefix=app&page=2");

    expect(
      resourceExplorerListStateHrefFromSearch("page=2", { page: 1 }, "/infrastructure/resources"),
    ).toBe("/infrastructure/resources");
  });

  it("persists sort in URL and saved views", () => {
    expect(
      resourceExplorerListStateHrefFromSearch("", { sortKey: "work", sortAsc: false }, "/infrastructure/resources"),
    ).toBe("/infrastructure/resources?sort=work&dir=desc");

    expect(encodeResourcesExplorerSavedViewSort("work", false)).toBe("work:desc");
    expect(parseResourcesExplorerSavedViewSort("work:desc")).toEqual({ sortKey: "work", sortAsc: false });
  });

  it("formats page range labels", () => {
    expect(formatResourcesExplorerPageRangeLabel({ page: 1, pageSize: 50, totalCount: 214 })).toBe(
      "Showing 1–50 of 214",
    );
    expect(formatResourcesExplorerPageRangeLabel({ page: 1, pageSize: 50, totalCount: 0 })).toBe("Showing 0 of 0");
  });
});
