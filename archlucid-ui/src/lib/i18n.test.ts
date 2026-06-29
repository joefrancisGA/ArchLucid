import { describe, expect, it } from "vitest";

import { RUNS_LIST_PAGE_SUBTITLE } from "./i18n";

describe("i18n runs list copy", () => {
  it("describes in-progress and finalized reviews on the reviews list subtitle", () => {
    expect(RUNS_LIST_PAGE_SUBTITLE).toBe(
      "Architecture review packages — in progress, finalized, and ready for export.",
    );
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("in progress");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("finalized");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).not.toMatch(/^finalized architecture reviews/);
  });
});
