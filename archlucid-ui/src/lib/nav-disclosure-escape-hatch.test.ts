import { describe, expect, it } from "vitest";

import { SHOW_ALL_DESTINATIONS, SIDEBAR_SHOW_ALL_FEATURES } from "@/lib/nav-disclosure-copy";

describe("nav disclosure escape hatch", () => {
  it("exposes Show all sidebar links as the evaluator escape hatch", () => {
    expect(SHOW_ALL_DESTINATIONS.show).toBe("Show all sidebar links");
    expect(SIDEBAR_SHOW_ALL_FEATURES.show).toBe(SHOW_ALL_DESTINATIONS.show);
    expect(SHOW_ALL_DESTINATIONS.show.toLowerCase()).not.toMatch(/\bdestination\b/);
    expect(SHOW_ALL_DESTINATIONS.title.toLowerCase()).not.toMatch(/unlock|level|earn|graduate/);
    expect(SHOW_ALL_DESTINATIONS.lockedReasonAfterFinalize).toBe(
      "Available after your first finalized review",
    );
  });
});
