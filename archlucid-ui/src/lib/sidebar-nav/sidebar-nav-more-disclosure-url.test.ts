import { describe, expect, it } from "vitest";

import {
  parseSidebarNavMoreGroupFromSearch,
  sidebarNavMoreDisclosureHrefFromSearch,
  sidebarNavMoreDisclosureHrefMatchesLocation,
} from "@/lib/sidebar-nav/sidebar-nav-more-disclosure-url";

describe("sidebar-nav-more-disclosure-url", () => {
  it("parses and builds sidebar more group query params", () => {
    expect(parseSidebarNavMoreGroupFromSearch("operator-admin")).toBe("operator-admin");
    expect(parseSidebarNavMoreGroupFromSearch(null)).toBe("");
    expect(sidebarNavMoreDisclosureHrefFromSearch("reviewTab=overview", "operate", "/architecture/reviews")).toBe(
      "/architecture/reviews?reviewTab=overview&sidebarMoreGroup=operate",
    );
    expect(sidebarNavMoreDisclosureHrefFromSearch("sidebarMoreGroup=operator-admin", null, "/")).toBe("/");
  });

  it("matches the current browser location when hrefs are equal", () => {
    const originalPathname = window.location.pathname;
    const originalSearch = window.location.search;

    window.history.replaceState({}, "", "/?sidebarMoreGroup=operator-admin");

    expect(sidebarNavMoreDisclosureHrefMatchesLocation("/?sidebarMoreGroup=operator-admin")).toBe(true);
    expect(sidebarNavMoreDisclosureHrefMatchesLocation("/")).toBe(false);

    window.history.replaceState({}, "", `${originalPathname}${originalSearch}`);
  });
});
