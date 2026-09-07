import { describe, expect, it } from "vitest";

import {
  resolveWorkingBackHref,
  resolveWorkingBackLocator,
  resolveWorkingReviewFindingsBackHref,
  resolveWorkingReviewPackageBackHref,
} from "@/lib/architecture/working-back-href";

describe("resolveWorkingBackLocator (AO-44)", () => {
  const draftRegistryEntries = [
    {
      draftId: "draft-001",
      displayName: "Payments",
      customerStatus: "in-review" as const,
      ownerLabel: "You",
      lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
      linkedReviewId: "run-001",
      serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
      parentArchitectureId: "architecture-identity-001",
    },
  ];

  it("returns nested review job and architecture desk when parent architecture is known", () => {
    const locator = resolveWorkingBackLocator({
      reviewId: "run-001",
      architectureId: "architecture-identity-001",
    });

    expect(locator.architectureDeskHref).toBe("/architecture/architectures/architecture-identity-001");
    expect(locator.reviewJobHref).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
    expect(locator.reviewJobHref).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("resolves architecture id from nested pathname when explicit id is absent", () => {
    const locator = resolveWorkingBackLocator({
      reviewId: "run-001",
      pathname: "/architecture/architectures/architecture-identity-001/reviews/run-001/findings/f-1",
    });

    expect(locator.reviewJobHref).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
  });

  it("falls back to draft registry parent architecture for peer deep pages", () => {
    const locator = resolveWorkingBackLocator({
      reviewId: "run-001",
      pathname: "/architecture/reviews/run-001/findings/f-1/evidence-trace",
      draftRegistryEntries,
    });

    expect(locator.architectureDeskHref).toBe("/architecture/architectures/architecture-identity-001");
    expect(locator.reviewJobHref).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
  });

  it("keeps peer review href when architecture parent is unknown", () => {
    const locator = resolveWorkingBackLocator({
      reviewId: "run-unlinked",
      draftRegistryEntries: [],
    });

    expect(locator.architectureDeskHref).toBeNull();
    expect(locator.reviewJobHref).toBe("/architecture/reviews/run-unlinked");
  });

  it("builds nested findings tab back href for finding detail wayfinding", () => {
    expect(
      resolveWorkingReviewFindingsBackHref({
        reviewId: "run-001",
        architectureId: "architecture-identity-001",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=findings",
    );
  });

  it("builds nested review-package tab back href for print return", () => {
    expect(
      resolveWorkingReviewPackageBackHref({
        reviewId: "run-001",
        architectureId: "architecture-identity-001",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=review-package",
    );
  });

  it("resolveWorkingBackHref mirrors reviewJobHref from the locator", () => {
    expect(
      resolveWorkingBackHref({
        reviewId: "run-001",
        architectureId: "architecture-identity-001",
        reviewTab: "findings",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=findings",
    );
  });
});
