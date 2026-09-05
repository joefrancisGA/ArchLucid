import { describe, expect, it } from "vitest";

import { resolveWorkingInsightsNavHref } from "./resolve-working-insights-nav-href";

describe("resolveWorkingInsightsNavHref (LS-05)", () => {
  it("scopes Ask to last-open review when path has no package", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/insights/ask-review-questions",
        pathname: "/",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("/insights/ask-review-questions?runId=run-last");
  });

  it("scopes Compare to the review in the current path", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/insights/compare-two-reviews",
        pathname: "/architecture/reviews/run-in-path",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("/insights/compare-two-reviews?priorRunId=run-in-path");
  });

  it("leaves unrelated nav hrefs unchanged", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/governance/findings",
        pathname: "/",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("/governance/findings");
  });
});
