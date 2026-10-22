import { describe, expect, it } from "vitest";

import {
  pageHelpDrawerSupplementForSlug,
  shouldShowDrawerSupplementDetail,
} from "@/lib/help/page-help-drawer-supplement";

describe("page-help-drawer-supplement", () => {
  it("returns richer findings orientation with key points", () => {
    const supplement = pageHelpDrawerSupplementForSlug("findings");

    expect(supplement?.detail).toContain("architecture risks");
    expect(supplement?.keyPoints?.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back to product documentation summaries for mapped help slugs", () => {
    const supplement = pageHelpDrawerSupplementForSlug("getting-started");

    expect(supplement?.detail).toContain("architecture evidence");
  });

  it("suppresses detail that mostly repeats Category-1 what-is-this-page copy", () => {
    expect(
      shouldShowDrawerSupplementDetail(
        "Track architecture risks from accepted findings, waivers, exceptions, and approval decisions.",
        "Track architecture risks from accepted findings, waivers, exceptions, and approval decisions.",
      ),
    ).toBe(false);
  });
});
