import { describe, expect, it } from "vitest";

import {
  SECURENOW_PUBLISHED_LIST_PRICE_EVALUATION_CREDIT,
  SECURENOW_PUBLISHED_LIST_PRICE_LEAD,
  SECURENOW_PUBLISHED_LIST_PRICE_POSTURE,
  SECURENOW_PUBLISHED_LIST_PRICE_ROWS,
} from "./securenow-published-list-price-copy";

describe("securenow-published-list-price-copy", () => {
  it("keeps the four SKU ids and locked fee phrases", () => {
    expect(SECURENOW_PUBLISHED_LIST_PRICE_ROWS.map((row) => row.id)).toEqual([
      "SN-EVAL",
      "SN-ANNUAL",
      "SN-SUB-ADD",
      "SN-SNAP-4",
    ]);
    expect(SECURENOW_PUBLISHED_LIST_PRICE_ROWS[0]?.price).toBe("**$8,000** once");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_ROWS[1]?.price).toBe("**$24,000** per year");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_ROWS[2]?.price).toBe("**$6,000** per year");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_ROWS[3]?.price).toBe("**$1,500** prepaid");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_EVALUATION_CREDIT).toContain("The **$8,000** evaluation fee");
  });

  it("states quote-only posture without checkout on public list-price chrome", () => {
    expect(SECURENOW_PUBLISHED_LIST_PRICE_LEAD).toContain("does not take payment");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_LEAD).toContain("NO_GO");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_POSTURE).toContain("exclude sales tax");
    expect(SECURENOW_PUBLISHED_LIST_PRICE_POSTURE).not.toMatch(/checkout/i);
  });
});
