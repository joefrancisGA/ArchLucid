import { describe, expect, it } from "vitest";

import {
  buildReviewWorkspaceRouteHref,
  isReviewWorkspaceRoutePath,
  parseReviewWorkspaceRouteFromHref,
  parseReviewWorkspaceRoutePath,
  readReviewWorkspaceRunIdFromHref,
} from "@/lib/architecture/review-workspace-route";

describe("review-workspace-route (AO-08 / flat peer)", () => {
  it("parses flat peer paths with and without trailing slash", () => {
    expect(parseReviewWorkspaceRoutePath("/architecture/reviews/run-a")).toEqual({
      runId: "run-a",
      architectureId: null,
      findingId: null,
      reviewTab: null,
    });
    expect(parseReviewWorkspaceRoutePath("/architecture/reviews/run-a/")).toEqual({
      runId: "run-a",
      architectureId: null,
      findingId: null,
      reviewTab: null,
    });
  });

  it("parses nested AO-08 review paths", () => {
    expect(
      parseReviewWorkspaceRoutePath(
        "/architecture/architectures/architecture-identity-001/reviews/run-001",
      ),
    ).toEqual({
      runId: "run-001",
      architectureId: "architecture-identity-001",
      findingId: null,
      reviewTab: null,
    });
  });

  it("parses nested and flat finding segments and encoded ids", () => {
    expect(
      parseReviewWorkspaceRoutePath("/architecture/reviews/run-a/findings/finding%2F1"),
    ).toMatchObject({
      runId: "run-a",
      findingId: "finding/1",
    });
    expect(
      parseReviewWorkspaceRoutePath(
        "/architecture/architectures/arch-1/reviews/run-b/findings/finding%2F2/",
      ),
    ).toMatchObject({
      runId: "run-b",
      architectureId: "arch-1",
      findingId: "finding/2",
    });
  });

  it("parses legacy peer /reviews/{reviewId}/runs/{runId} paths", () => {
    expect(parseReviewWorkspaceRoutePath("/architecture/reviews/r1/runs/run1")).toEqual({
      runId: "run1",
      architectureId: null,
      findingId: null,
      reviewTab: null,
    });
  });

  it("parses href query reviewTab and findingId", () => {
    expect(
      parseReviewWorkspaceRouteFromHref(
        "/architecture/architectures/arch-1/reviews/run-1?reviewTab=activity&findingId=f-9",
      ),
    ).toEqual({
      runId: "run-1",
      architectureId: "arch-1",
      findingId: "f-9",
      reviewTab: "activity",
    });
    expect(
      parseReviewWorkspaceRouteFromHref("/architecture/reviews/run-a?reviewTab=findings"),
    ).toEqual({
      runId: "run-a",
      architectureId: null,
      findingId: null,
      reviewTab: "findings",
    });
  });

  it("readReviewWorkspaceRunIdFromHref matches desk deep links", () => {
    expect(readReviewWorkspaceRunIdFromHref("/architecture/reviews/abc?reviewTab=activity")).toBe("abc");
    expect(
      readReviewWorkspaceRunIdFromHref(
        "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=activity",
      ),
    ).toBe("run-001");
  });

  it("buildReviewWorkspaceRouteHref emits flat and nested bases", () => {
    expect(
      buildReviewWorkspaceRouteHref({ runId: "run-a", reviewTab: "overview" }),
    ).toBe("/architecture/reviews/run-a?reviewTab=overview");
    expect(
      buildReviewWorkspaceRouteHref({
        runId: "run-001",
        architectureId: "architecture-identity-001",
        reviewTab: "activity",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=activity",
    );
    expect(
      buildReviewWorkspaceRouteHref({
        runId: "run-a",
        findingId: "f-1",
        findingIdOnPath: true,
        reviewTab: "findings",
      }),
    ).toBe("/architecture/reviews/run-a/findings/f-1?reviewTab=findings");
  });

  it("does not treat intake /new as a run id", () => {
    expect(parseReviewWorkspaceRoutePath("/architecture/reviews/new")).toBeNull();
    expect(isReviewWorkspaceRoutePath("/architecture/reviews/new")).toBe(true);
  });

  it("isReviewWorkspaceRoutePath covers hub and workspace routes", () => {
    expect(isReviewWorkspaceRoutePath("/architecture/reviews")).toBe(true);
    expect(isReviewWorkspaceRoutePath("/architecture/reviews/new")).toBe(true);
    expect(isReviewWorkspaceRoutePath("/architecture/reviews/run-a")).toBe(true);
    expect(
      isReviewWorkspaceRoutePath("/architecture/architectures/arch-1/reviews/run-1"),
    ).toBe(true);
    expect(isReviewWorkspaceRoutePath("/architecture/architectures/arch-1/drafts/d-1")).toBe(false);
  });
});
