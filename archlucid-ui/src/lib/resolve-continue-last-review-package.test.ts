import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import type { RunSummary } from "@/types/authority";

const run: RunSummary = {
  runId: "run-abc",
  projectId: "proj-1",
  createdUtc: "2026-01-01T00:00:00Z",
};

describe("resolve-continue-last-review-package (CD-11)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when no recent review is stored", () => {
    expect(resolveContinueLastReviewPackageTarget([run])).toBeNull();
  });

  it("resumes the last-open review when it is still accessible", () => {
    localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            href: "/architecture/reviews/run-abc",
            label: "Payments modernization",
            kind: "review",
            visitedAtUtc: "2026-01-02T00:00:00Z",
          },
        ],
      }),
    );

    const target = resolveContinueLastReviewPackageTarget([run]);

    expect(target?.runId).toBe("run-abc");
    expect(target?.href).toBe("/architecture/reviews/run-abc");
  });

  it("prefers server last-open review id over local recent views", () => {
    localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            href: "/architecture/reviews/run-other",
            label: "Other",
            kind: "review",
            visitedAtUtc: "2026-01-02T00:00:00Z",
          },
        ],
      }),
    );

    const target = resolveContinueLastReviewPackageTarget([run], "run-abc");

    expect(target?.runId).toBe("run-abc");
  });

  it("does not invent a showcase id when the stored review is inaccessible", () => {
    localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            href: "/architecture/reviews/missing-run",
            label: "Missing",
            kind: "review",
            visitedAtUtc: "2026-01-02T00:00:00Z",
          },
        ],
      }),
    );

    expect(resolveContinueLastReviewPackageTarget([run])).toBeNull();
  });
});
