import { describe, expect, it } from "vitest";

import { isSampleReviewRun } from "@/lib/reviews/is-sample-review-run";
import { SHOWCASE_CREATED_STATIC_DEMO_RUN_ID } from "@/lib/showcase-created-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function runSummary(overrides: Partial<RunSummary>): RunSummary {
  return {
    runId: "tenant-run-1",
    projectId: "default",
    createdUtc: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isSampleReviewRun", () => {
  it("returns false for a normal tenant-owned run", () => {
    expect(isSampleReviewRun(runSummary({ runId: "tenant-run-1" }))).toBe(false);
  });

  it("returns true when isSample is set on the API row", () => {
    expect(
      isSampleReviewRun(
        runSummary({
          runId: "b7c8d9e0-f1a2-3456-7890-abcdcreated74201",
          isSample: true,
        }),
      ),
    ).toBe(true);
  });

  it("returns true for showcase and created showcase slugs", () => {
    expect(isSampleReviewRun(runSummary({ runId: SHOWCASE_STATIC_DEMO_RUN_ID }))).toBe(true);
    expect(isSampleReviewRun(runSummary({ runId: SHOWCASE_CREATED_STATIC_DEMO_RUN_ID }))).toBe(true);
  });

  it("returns true for demo welcome runs", () => {
    expect(isSampleReviewRun(runSummary({ runId: "tenant-run-1", isDemoWelcomeRun: true }))).toBe(true);
  });
});
