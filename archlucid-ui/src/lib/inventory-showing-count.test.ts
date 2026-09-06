import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_DEFAULT_PAGE_SIZE,
  ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE,
  formatInventoryShowingLine,
  formatInventoryShowingFirstLine,
  resolveInventoryShowingCount,
  shouldShowInventoryIncompleteness,
} from "@/lib/inventory-showing-count";

describe("inventory-showing-count (DA-07)", () => {
  it("uses 50 as the Working reviews hub default page size", () => {
    expect(REVIEWS_HUB_DEFAULT_PAGE_SIZE).toBe(50);
  });

  it("uses 50 as the Working architecture identities hub default page size (CA-39)", () => {
    expect(ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE).toBe(50);
  });

  it("does not shout incompleteness when all rows fit one page", () => {
    expect(shouldShowInventoryIncompleteness(47, 47)).toBe(false);
    expect(formatInventoryShowingLine(47, 47)).toBeNull();
    expect(formatInventoryShowingLine(47, 47, false)).toBeNull();
  });

  it("shouts incompleteness when total exceeds the loaded slice", () => {
    expect(shouldShowInventoryIncompleteness(20, 47)).toBe(true);
    expect(formatInventoryShowingLine(20, 47)).toBe("Showing 20 of 47");
    expect(resolveInventoryShowingCount({ loaded: 20, total: 47 }).isIncomplete).toBe(true);
  });

  it("shouts incompleteness when hasMore is true even if loaded equals total on the page", () => {
    expect(formatInventoryShowingLine(20, 20, true)).toBe("Showing 20 of 20");
  });

  it("formats first-N remainder copy without inventing a total", () => {
    expect(formatInventoryShowingFirstLine(20, 27)).toBe("Showing first 20. 27 more");
    expect(formatInventoryShowingFirstLine(20, 0)).toBeNull();
  });
});
