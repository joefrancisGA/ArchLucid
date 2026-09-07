import { describe, expect, it } from "vitest";

import {
  architectureIdentityPath,
  architectureNestedDraftPath,
  architectureNestedReviewPath,
  resolveArchitectureReviewHref,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import {
  isNestedReviewArchitectureMismatch,
  resolveArchitectureReviewTabHref,
  resolveWorkingPeerReviewRedirectHref,
} from "@/lib/architecture/working-architecture-review-routes";

describe("architecture nested route builders (AO-02)", () => {
  it("builds nested review and draft paths under the identity desk", () => {
    expect(architectureNestedReviewPath("architecture-identity-001", "run-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001",
    );
    expect(architectureNestedDraftPath("architecture-identity-001", "draft-001")).toBe(
      "/architecture/architectures/architecture-identity-001/drafts/draft-001",
    );
  });

  it("keeps the desk path free of /reviews segments", () => {
    expect(architectureIdentityPath("architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001",
    );
    expect(architectureIdentityPath("architecture-identity-001")).not.toContain("/reviews");
  });

  it("prefers nested review href on Working when architecture id is known", () => {
    expect(resolveArchitectureReviewHref("run-001", "architecture-identity-001")).toBe(
      architectureNestedReviewPath("architecture-identity-001", "run-001"),
    );
    expect(resolveArchitectureReviewHref("run-001", null)).toBe(reviewDetailPath("run-001"));
  });

  it("AO-08: builds nested review tab hrefs for in-flight resume", () => {
    expect(resolveArchitectureReviewTabHref("run-001", "activity", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=activity",
    );
  });
});

describe("resolveWorkingPeerReviewRedirectHref (AO-06)", () => {
  it("redirects peer review paths to nested paths and preserves query strings", () => {
    expect(
      resolveWorkingPeerReviewRedirectHref({
        architectureId: "arch-1",
        reviewId: "run-1",
        pathname: "/architecture/reviews/run-1",
        search: "reviewTab=findings",
      }),
    ).toBe("/architecture/architectures/arch-1/reviews/run-1?reviewTab=findings");

    expect(
      resolveWorkingPeerReviewRedirectHref({
        architectureId: "arch-1",
        reviewId: "run-1",
        pathname: "/architecture/reviews/run-1/findings/f-1",
      }),
    ).toBe("/architecture/architectures/arch-1/reviews/run-1/findings/f-1");
  });

  it("detects nested route architecture mismatches", () => {
    expect(isNestedReviewArchitectureMismatch("arch-a", "arch-b")).toBe(true);
    expect(isNestedReviewArchitectureMismatch("arch-a", "arch-a")).toBe(false);
    expect(isNestedReviewArchitectureMismatch("arch-a", null)).toBe(false);
  });
});
