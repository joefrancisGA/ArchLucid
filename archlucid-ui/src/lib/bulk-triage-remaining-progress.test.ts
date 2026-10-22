import { describe, expect, it } from "vitest";

import { buildBulkTriageRemainingProgress } from "@/lib/bulk-triage-remaining-progress";

describe("bulk-triage-remaining-progress (TB-2213)", () => {
  it("formats open of total left for a finite queue", () => {
    const progress = buildBulkTriageRemainingProgress({ openCount: 3, totalInView: 12 });

    expect(progress.openCount).toBe(3);
    expect(progress.totalInView).toBe(12);
    expect(progress.label).toBe("3 of 12 left");
    expect(progress.visible).toBe(true);
    expect(progress.complete).toBe(false);
  });

  it("marks complete when nothing remains open", () => {
    const progress = buildBulkTriageRemainingProgress({ openCount: 0, totalInView: 8 });

    expect(progress.label).toBe("0 of 8 left");
    expect(progress.visible).toBe(true);
    expect(progress.complete).toBe(true);
  });

  it("hides when the view is empty", () => {
    const progress = buildBulkTriageRemainingProgress({ openCount: 0, totalInView: 0 });

    expect(progress.label).toBe("0 of 0 left");
    expect(progress.visible).toBe(false);
    expect(progress.complete).toBe(false);
  });

  it("clamps open to total and rejects non-finite negatives", () => {
    expect(buildBulkTriageRemainingProgress({ openCount: 20, totalInView: 5 }).label).toBe("5 of 5 left");
    expect(buildBulkTriageRemainingProgress({ openCount: -2, totalInView: 4 }).label).toBe("0 of 4 left");
    expect(buildBulkTriageRemainingProgress({ openCount: Number.NaN, totalInView: 3 }).label).toBe(
      "0 of 3 left",
    );
    expect(buildBulkTriageRemainingProgress({ openCount: 1.9, totalInView: 2.7 }).label).toBe(
      "1 of 2 left",
    );
  });
});