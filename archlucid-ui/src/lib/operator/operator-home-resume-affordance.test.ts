import { describe, expect, it } from "vitest";

import { resolveOperatorHomeResumeAffordancePlan } from "@/lib/operator/operator-home-resume-affordance";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import type { RunSummary } from "@/types/authority";

describe("resolveOperatorHomeResumeAffordancePlan", () => {
  it("suppresses continue-last when unfinished work already surfaces the same review", () => {
    const runs: RunSummary[] = [
      {
        runId: "review-42",
        projectId: "default",
        description: "Payments platform",
        hasFindingsSnapshot: true,
      },
    ];

    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        entries: [
          {
            kind: "review",
            href: "/architecture/reviews/review-42",
            label: "Payments platform",
            visitedAtUtc: "2026-01-15T12:00:00.000Z",
          },
        ],
      }),
    );

    const plan = resolveOperatorHomeResumeAffordancePlan({
      runs,
      drafts: [],
      incompleteWizards: [],
    });

    expect(plan.showContinueLast).toBe(false);
    expect(plan.continueLastVariant).toBe("outline");
  });
});
