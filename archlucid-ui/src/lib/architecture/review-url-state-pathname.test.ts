import { describe, expect, it } from "vitest";

import {
  parseNestedReviewDeskFromPathname,
  parsePeerReviewRunIdFromPathname,
  resolveReviewUrlStatePathname,
  resolveScopedReviewPath,
} from "@/lib/architecture/review-url-state-pathname";

describe("review-url-state-pathname", () => {
  it("parseNestedReviewDeskFromPathname extracts architecture id and run id", () => {
    const desk = parseNestedReviewDeskFromPathname(
      "/architecture/architectures/acme/reviews/run-1",
    );

    expect(desk).toEqual({ architectureId: "acme", reviewRunId: "run-1" });
  });

  it("parseNestedReviewDeskFromPathname supports encoded architecture ids", () => {
    const desk = parseNestedReviewDeskFromPathname(
      "/architecture/architectures/acme%2Fenv-prod/reviews/run-9?reviewTab=review-package",
    );

    expect(desk).toEqual({ architectureId: "acme/env-prod", reviewRunId: "run-9" });
  });

  it("parseNestedReviewDeskFromPathname ignores nested start-review", () => {
    expect(parseNestedReviewDeskFromPathname("/architecture/architectures/acme/reviews/new")).toBe(null);
  });

  it("parsePeerReviewRunIdFromPathname extracts run id", () => {
    expect(parsePeerReviewRunIdFromPathname("/architecture/reviews/run-2/findings/f1")).toBe("run-2");
  });

  it("parsePeerReviewRunIdFromPathname ignores list and intake", () => {
    expect(parsePeerReviewRunIdFromPathname("/architecture/reviews")).toBe(null);
    expect(parsePeerReviewRunIdFromPathname("/architecture/reviews/new")).toBe(null);
  });

  it("resolveReviewUrlStatePathname preserves nested desk when pathname is nested", () => {
    const href = resolveReviewUrlStatePathname(
      "/architecture/architectures/parent/reviews/old-run",
      "new-run",
    );

    expect(href).toBe("/architecture/architectures/parent/reviews/new-run");
  });

  it("resolveReviewUrlStatePathname uses peer href when pathname is peer review", () => {
    const href = resolveReviewUrlStatePathname("/architecture/reviews/old-run", "new-run");

    expect(href).toBe("/architecture/reviews/new-run");
  });

  it("resolveReviewUrlStatePathname uses peer href when pathname is missing", () => {
    const href = resolveReviewUrlStatePathname(null, "run-z");

    expect(href).toBe("/architecture/reviews/run-z");
  });

  it("resolveScopedReviewPath appends suffix on nested desk base", () => {
    const href = resolveScopedReviewPath("/provenance", {
      runId: "run-1",
      pathname: "/architecture/architectures/parent/reviews/run-1",
    });

    expect(href).toBe("/architecture/architectures/parent/reviews/run-1/provenance");
  });

});
