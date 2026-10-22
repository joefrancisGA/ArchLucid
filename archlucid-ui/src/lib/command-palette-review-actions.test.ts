import { describe, expect, it } from "vitest";

import { buildCommandPaletteReviewActions } from "@/lib/command-palette-review-actions";

describe("buildCommandPaletteReviewActions", () => {
  it("returns no actions without a run id", () => {
    expect(buildCommandPaletteReviewActions(null)).toEqual([]);
    expect(buildCommandPaletteReviewActions("   ")).toEqual([]);
  });

  it("builds compare, replay, and sponsor actions for a run", () => {
    const actions = buildCommandPaletteReviewActions("abc-123");

    expect(actions).toHaveLength(3);
    expect(actions[0]).toMatchObject({
      id: "action-compare-this-review",
      label: "Compare this review",
      href: "/insights/compare-two-reviews?priorRunId=abc-123",
    });
    expect(actions[1]?.href).toContain("runId=abc-123");
    expect(actions[2]?.href).toContain("runId=abc-123");
  });
});
