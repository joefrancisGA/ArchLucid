import { describe, expect, it } from "vitest";

import {
  formatRunDetailAwaitingActionCountDisplay,
  formatRunDetailCriticalFindingCountDisplay,
  formatRunDetailHighFindingCountDisplay,
} from "@/lib/reviews/run-detail-sponsor-finding-count-display";

describe("run-detail-sponsor-finding-count-display", () => {
  it("does not show None or zero when the findings snapshot is absent", () => {
    expect(formatRunDetailCriticalFindingCountDisplay(false, 0)).toBe(
      "Critical finding count was not stored.",
    );
    expect(formatRunDetailHighFindingCountDisplay(undefined, 3)).toBe(
      "High finding count was not stored.",
    );
    expect(formatRunDetailAwaitingActionCountDisplay(false, 0)).toBe(
      "Findings requiring action were not stored.",
    );
  });

  it("labels zero counts on a stored snapshot without None", () => {
    expect(formatRunDetailCriticalFindingCountDisplay(true, 0)).toBe(
      "No critical findings were stored.",
    );
    expect(formatRunDetailHighFindingCountDisplay(true, 0)).toBe("No high findings were stored.");
    expect(formatRunDetailAwaitingActionCountDisplay(true, 0)).toBe("0");
  });
});
