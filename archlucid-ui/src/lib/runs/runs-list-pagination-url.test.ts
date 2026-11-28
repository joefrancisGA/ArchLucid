import { describe, expect, it } from "vitest";

import {
  runsListNextPageHrefFromSearch,
  runsListPreviousPageHrefFromSearch,
} from "./runs-list-pagination-url";
import { REVIEWS_HUB_MAX_PAGE_SIZE } from "@/lib/inventory-showing-count";

const pathname = "/architecture/reviews";
const parse = (href: string) => new URL(href, "https://example.invalid").searchParams;

describe("Reviews pagination links", () => {
  it("caps the previous link size at the server limit without losing list context", () => {
    const next = parse(runsListPreviousPageHrefFromSearch(
      "projectId=chosen&page=3&pageSize=999&filter=orphan-candidates&cursor=old",
      pathname,
      "default",
      REVIEWS_HUB_MAX_PAGE_SIZE,
    ));

    expect(next.get("pageSize")).toBe(String(REVIEWS_HUB_MAX_PAGE_SIZE));
    expect(next.get("projectId")).toBe("chosen");
    expect(next.get("page")).toBe("1");
    expect(next.get("filter")).toBe("orphan-candidates");
    expect(next.has("cursor")).toBe(false);
  });

  it("caps the next link size at the server limit while retaining the next cursor", () => {
    const next = parse(runsListNextPageHrefFromSearch(
      "page=2&pageSize=999&q=sample&cursor=old",
      pathname,
      "default",
      REVIEWS_HUB_MAX_PAGE_SIZE,
      3,
      "next-cursor",
    ));

    expect(next.get("pageSize")).toBe(String(REVIEWS_HUB_MAX_PAGE_SIZE));
    expect(next.get("page")).toBe("3");
    expect(next.get("q")).toBe("sample");
    expect(next.get("cursor")).toBe("next-cursor");
  });

  it.each([
    ["pageSize=20", "20"],
    [`pageSize=${REVIEWS_HUB_MAX_PAGE_SIZE}`, String(REVIEWS_HUB_MAX_PAGE_SIZE)],
    ["pageSize=invalid", "50"],
    ["", "50"],
  ])("keeps valid sizes and preserves the supplied fallback for %s", (search, expected) => {
    const next = parse(runsListNextPageHrefFromSearch(search, pathname, "default", 50, 2, null));

    expect(next.get("pageSize")).toBe(expected);
  });
});
