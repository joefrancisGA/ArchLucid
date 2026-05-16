import { describe, expect, it } from "vitest";

import { runsListPageFilterStatusLine } from "./runs-list-filter-status-line";

describe("runsListPageFilterStatusLine", () => {
  it("uses compact copy when the full page matches", () => {
    expect(runsListPageFilterStatusLine(1, 1, false)).toBe("1 review on this page.");
    expect(runsListPageFilterStatusLine(3, 3, false)).toBe("3 reviews on this page.");
  });

  it("uses subset wording when filtered", () => {
    expect(runsListPageFilterStatusLine(1, 12, true)).toBe("Showing 1 of 12 on this page (matches filter)");
  });
});
