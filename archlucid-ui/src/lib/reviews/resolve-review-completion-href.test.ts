import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";

import { resolveReviewCompletionHref } from "@/lib/reviews/resolve-review-completion-href";

describe("resolveReviewCompletionHref (IP-006)", () => {
  it("Working + architectureId opens nested findings", () => {
    const href = resolveReviewCompletionHref({
      runId: "run-42",
      pathname: "/architecture/reviews",
      architectureId: "architecture-identity-001",
      isWorkingMode: true,
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("architecture-identity-001")}?runId=run-42`,
    );
  });

  it("Guided keeps review-detail when architecture is known", () => {
    const href = resolveReviewCompletionHref({
      runId: "run-42",
      pathname: "/architecture/reviews",
      architectureId: "architecture-identity-001",
      isWorkingMode: false,
    });

    expect(href).toBe("/architecture/architectures/architecture-identity-001/reviews/run-42");
  });

  it("unlinked Working jobs keep peer review-detail", () => {
    const href = resolveReviewCompletionHref({
      runId: "run-unlinked",
      pathname: "/architecture/reviews",
      isWorkingMode: true,
    });

    expect(href).toBe("/architecture/reviews/run-unlinked");
  });
});
