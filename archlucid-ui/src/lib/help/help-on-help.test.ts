import { describe, expect, it } from "vitest";

import { searchHelpDocumentation } from "@/lib/help/help-index";
import {
  HELP_ON_HELP_MAX_SECTIONS,
  helpDocRecordTargetsPath,
  isHelpOnHelpPath,
  listHelpOnHelpSectionAnchors,
  prioritizeHelpSearchHitsForCurrentPage,
} from "@/lib/help/help-on-help";

describe("help-on-help", () => {
  it("detects help routes for help-on-help mode (TB-1046)", () => {
    expect(isHelpOnHelpPath("/help/first-architecture-review")).toBe(true);
    expect(isHelpOnHelpPath("/help/first-architecture-review#first-review-path")).toBe(true);
    expect(isHelpOnHelpPath("/help")).toBe(true);
    expect(isHelpOnHelpPath("/architecture/reviews/new")).toBe(false);
    expect(isHelpOnHelpPath("/")).toBe(false);
  });

  it("lists in-page section anchors for core-pilot from the help search index", () => {
    const anchors = listHelpOnHelpSectionAnchors("/help/first-architecture-review");

    expect(anchors.length).toBeGreaterThan(0);
    expect(anchors.length).toBeLessThanOrEqual(HELP_ON_HELP_MAX_SECTIONS);
    expect(anchors.every((anchor) => anchor.sectionSlug.length > 0)).toBe(true);
    expect(anchors.map((anchor) => anchor.sectionSlug)).toContain("first-review-path");
    expect(anchors.every((anchor) => helpDocRecordTargetsPath(anchor, "/help/first-architecture-review"))).toBe(true);
  });

  it("returns no anchors off help routes", () => {
    expect(listHelpOnHelpSectionAnchors("/architecture/reviews")).toEqual([]);
  });

  it("prioritizes current-page search hits when on a help article", () => {
    const hits = searchHelpDocumentation("review", 24);
    const prioritized = prioritizeHelpSearchHitsForCurrentPage(hits, "/help/first-architecture-review");

    expect(prioritized.length).toBe(hits.length);

    const firstCurrentIndex = prioritized.findIndex((hit) =>
      helpDocRecordTargetsPath(hit, "/help/first-architecture-review"),
    );
    const firstOtherIndex = prioritized.findIndex(
      (hit) => !helpDocRecordTargetsPath(hit, "/help/first-architecture-review"),
    );

    if (firstCurrentIndex >= 0 && firstOtherIndex >= 0) {
      expect(firstCurrentIndex).toBeLessThan(firstOtherIndex);
    }
  });
});
