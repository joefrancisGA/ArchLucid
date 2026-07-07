import { describe, expect, it } from "vitest";

import { RUNS_LIST_PAGE_SUBTITLE } from "./i18n";

describe("i18n runs list copy", () => {
  it("describes when to use the reviews list in the page subtitle", () => {
    expect(RUNS_LIST_PAGE_SUBTITLE).toBe(
      "Resume in-progress reviews, open committed review packages, or explore a sample package. Each package includes the review record, findings, evidence trail, signed decision record, and exports.",
    );
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("in-progress");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("committed");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).not.toMatch(/^finalized architecture reviews/);
  });
});
