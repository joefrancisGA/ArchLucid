import { describe, expect, it } from "vitest";

import { pathnameShowsContextualHelpFab } from "@/lib/page-contextual-help-fab-paths";

describe("pathnameShowsContextualHelpFab", () => {
  it("matches high-friction analysis and governance surfaces", () => {
    expect(pathnameShowsContextualHelpFab("/insights/compare-two-reviews")).toBe(true);
    expect(pathnameShowsContextualHelpFab("/internal/validate-route")).toBe(true);
    expect(pathnameShowsContextualHelpFab("/insights/evidence-graph")).toBe(true);
    expect(pathnameShowsContextualHelpFab("/governance/policy-packs")).toBe(true);
    expect(pathnameShowsContextualHelpFab("/insights/ask-review-questions")).toBe(true);
    expect(pathnameShowsContextualHelpFab("/insights/search-review-evidence")).toBe(true);
  });

  it("does not match unrelated operator routes", () => {
    expect(pathnameShowsContextualHelpFab("/architecture/reviews")).toBe(false);
    expect(pathnameShowsContextualHelpFab("/")).toBe(false);
  });
});
