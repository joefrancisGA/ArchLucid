import { describe, expect, it } from "vitest";

import {
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedFindingsPath,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";
import { resolveWorkingInsightsNavHref } from "./resolve-working-insights-nav-href";

describe("resolveWorkingInsightsNavHref (LS-05 / SY-45)", () => {
  const architectureId = "architecture-identity-001";

  it("scopes Ask to nested architecture desk when last-open architecture is known", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/insights/ask-review-questions",
        pathname: "/",
        lastOpenReviewId: "run-last",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`${architectureNestedAskPath(architectureId)}?runId=run-last`);
  });

  it("scopes Compare to nested architecture desk with open package run", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/insights/compare-two-reviews",
        pathname: "/architecture/architectures/architecture-identity-001",
        lastOpenReviewId: "run-last",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`${architectureNestedComparePath(architectureId)}?priorRunId=run-last&architectureId=${architectureId}`);
  });

  it("scopes Evidence graph to nested architecture desk", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/insights/evidence-graph",
        pathname: "/architecture/architectures/architecture-identity-001/reviews/run-nested",
        lastOpenReviewId: "run-last",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`${architectureNestedGraphPath(architectureId)}?runId=run-nested`);
  });

  it("scopes Findings to nested architecture desk", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/governance/findings",
        pathname: "/",
        lastOpenArchitectureId: architectureId,
      }),
    ).toContain(architectureNestedFindingsPath(architectureId));
  });

  it("leaves unrelated nav hrefs unchanged", () => {
    expect(
      resolveWorkingInsightsNavHref({
        href: "/governance/alerts",
        pathname: "/",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("/governance/alerts");
  });
});
