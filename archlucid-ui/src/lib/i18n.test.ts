import { describe, expect, it } from "vitest";

import { RUNS_LIST_PAGE_SUBTITLE } from "./i18n";

describe("i18n runs list copy", () => {
  it("describes when to use the reviews list in the page subtitle", () => {
    expect(RUNS_LIST_PAGE_SUBTITLE).toBe(
      "Create, refine, evaluate, and approve architecture reviews.",
    );
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("create");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).toContain("review");
    expect(RUNS_LIST_PAGE_SUBTITLE.toLowerCase()).not.toMatch(/^finalized architecture reviews/);
  });
});
