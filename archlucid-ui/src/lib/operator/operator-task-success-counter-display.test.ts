import { describe, expect, it } from "vitest";

import { safeNonNegativeWholeDisplay } from "@/lib/operator/operator-task-success-counter-display";

describe("safeNonNegativeWholeDisplay", () => {
  it("treats null, undefined, and blank strings as not returned", () => {
    expect(safeNonNegativeWholeDisplay(null)).toBe("Not returned");
    expect(safeNonNegativeWholeDisplay(undefined)).toBe("Not returned");
    expect(safeNonNegativeWholeDisplay("")).toBe("Not returned");
    expect(safeNonNegativeWholeDisplay("   ")).toBe("Not returned");
  });

  it("renders explicit zero and positive whole numbers", () => {
    expect(safeNonNegativeWholeDisplay(0)).toBe("0");
    expect(safeNonNegativeWholeDisplay("0")).toBe("0");
    expect(safeNonNegativeWholeDisplay(3.9)).toBe("3");
  });

  it("rejects negative and non-finite values", () => {
    expect(safeNonNegativeWholeDisplay(-1)).toBe("Not returned");
    expect(safeNonNegativeWholeDisplay(Number.NaN)).toBe("Not returned");
  });
});
