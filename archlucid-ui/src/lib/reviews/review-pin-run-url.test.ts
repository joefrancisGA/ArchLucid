import { describe, expect, it } from "vitest";

import {
  buildPinReviewToDeskHref,
  buildReviewDetailPinHref,
  isValidPinRunId,
  readPinRunIdFromSearchParams,
  reviewPinRunHrefFromSearch,
} from "@/lib/reviews/review-pin-run-url";

describe("review-pin-run-url", () => {
  it("reads pinRunId from search params", () => {
    expect(readPinRunIdFromSearchParams(new URLSearchParams("pinRunId=run-b"))).toBe("run-b");
    expect(readPinRunIdFromSearchParams(new URLSearchParams())).toBeNull();
  });

  it("rejects pin when it matches the primary run", () => {
    expect(isValidPinRunId("run-a", "run-a")).toBe(false);
    expect(isValidPinRunId("run-a", "run-b")).toBe(true);
  });

  it("builds shareable review-detail href with pinRunId", () => {
    expect(buildReviewDetailPinHref("run-a", "run-b", { reviewTab: "findings" })).toBe(
      "/architecture/reviews/run-a?reviewTab=findings&pinRunId=run-b",
    );
  });

  it("AO-37: builds nested pin href when architecture id is known", () => {
    expect(
      buildReviewDetailPinHref("run-a", "run-b", {
        architectureId: "architecture-identity-001",
        reviewTab: "findings",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-a?reviewTab=findings&pinRunId=run-b",
    );
  });

  it("merges pin into existing search on desk entry", () => {
    expect(
      buildPinReviewToDeskHref({
        pinRunId: "run-b",
        primaryRunId: "run-a",
      }),
    ).toBe("/architecture/reviews/run-a?pinRunId=run-b");
  });

  it("AO-37: compare pin opens nested primary desk when architecture id is provided", () => {
    expect(
      buildPinReviewToDeskHref({
        pinRunId: "run-baseline",
        primaryRunId: "run-updated",
        architectureId: "architecture-identity-001",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-updated?pinRunId=run-baseline",
    );
  });

  it("clears pinRunId from href when closing", () => {
    expect(
      reviewPinRunHrefFromSearch(
        "reviewTab=overview&pinRunId=run-b",
        null,
        "/architecture/architectures/architecture-identity-001/reviews/run-a",
      ),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-a?reviewTab=overview");
  });
});
