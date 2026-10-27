import { describe, expect, it } from "vitest";

import { resolveOperatorUnfinishedWorkRailItemResumeTarget } from "@/lib/operator/operator-unfinished-work-rail-resume-target";
import { matchesOperatorHomeHeroResumeTarget } from "@/lib/operator/operator-home-hero-resume-target";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

function reviewRailItem(id: string, href: string): UnfinishedWorkRailItem {
  return {
    id,
    kind: "review-in-progress",
    title: "Payments platform",
    href,
    statusLabel: "In progress",
    updatedUtc: null,
    workTypeLabel: "Architecture review",
    activityLabel: null,
    actionLabel: "Continue",
  };
}

describe("resolveOperatorUnfinishedWorkRailItemResumeTarget", () => {
  it("prefers TB-2369 row id when href does not parse a run id", () => {
    const target = resolveOperatorUnfinishedWorkRailItemResumeTarget(
      reviewRailItem("review-in-progress:review-42", "/architecture/reviews/new"),
    );

    expect(target.runId).toBe("review-42");
  });

  it("prefers href-encoded run id when TB-2369 row id conflicts with desk highlightReviewId", () => {
    const target = resolveOperatorUnfinishedWorkRailItemResumeTarget(
      reviewRailItem(
        "review-in-progress:run-a",
        "/architecture/architectures/architecture-identity-001?highlightReviewId=run-b",
      ),
    );

    expect(target.runId).toBe("run-b");
  });

  it("does not suppress hero Continue when row id conflicts with desk highlightReviewId", () => {
    const railTarget = resolveOperatorUnfinishedWorkRailItemResumeTarget(
      reviewRailItem(
        "review-in-progress:run-a",
        "/architecture/architectures/architecture-identity-001?highlightReviewId=run-b",
      ),
    );

    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/reviews/run-a", runId: "run-a" },
        railTarget,
      ),
    ).toBe(false);
  });

  it("suppresses duplicate Continue when hero matches rail row id but not href", () => {
    const railTarget = resolveOperatorUnfinishedWorkRailItemResumeTarget(
      reviewRailItem("review-in-progress:run-hero", "/architecture/reviews/new"),
    );

    expect(
      matchesOperatorHomeHeroResumeTarget(
        { href: "/architecture/reviews/run-hero", runId: "run-hero" },
        railTarget,
      ),
    ).toBe(true);
  });
});
