import { describe, expect, it } from "vitest";

import {
  deriveInventoryHiddenFilterHonesty,
  formatInventoryHiddenFilterLine,
} from "@/lib/inventory-hidden-filter-honesty";

describe("inventory-hidden-filter-honesty (CA-40)", () => {
  it("returns null when no rows are hidden", () => {
    const result = deriveInventoryHiddenFilterHonesty({
      visibleCount: 3,
      filteredPoolCount: 3,
      unitSingular: "review",
      unitPlural: "reviews",
    });

    expect(result.hasHidden).toBe(false);
    expect(result.line).toBeNull();
  });

  it("names the active filter when rows are hidden", () => {
    expect(
      formatInventoryHiddenFilterLine(3, "review", "reviews", "Finalized"),
    ).toBe("3 reviews hidden by Finalized filter");
  });

  it("CA-40: filter hides 3 reviews → copy includes 3", () => {
    const result = deriveInventoryHiddenFilterHonesty({
      visibleCount: 1,
      filteredPoolCount: 4,
      unitSingular: "review",
      unitPlural: "reviews",
      filterLabel: "Draft",
    });

    expect(result.hiddenCount).toBe(3);
    expect(result.line).toBe("3 reviews hidden by Draft filter");
    expect(result.hasHidden).toBe(true);
  });
});
