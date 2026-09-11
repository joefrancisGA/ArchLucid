import { describe, expect, it } from "vitest";

import { resolveFinalizeReadinessBlockAction } from "@/lib/review-quality/finalize-readiness-block-action";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

describe("resolveFinalizeReadinessBlockAction", () => {
  it("deep-links deferred scorecard blocks to the deferred findings job view", () => {
    const block: FinalizeReadinessBlock = {
      layer: "scorecard",
      code: "scorecard",
      message: "1 deferred finding still needs revisit.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action).toEqual({
      href: "/architecture/reviews/run-123?reviewTab=findings&findingJobView=deferred",
      label: "Resolve deferred findings",
    });
  });

  it("deep-links skipped must blocks to the activity finalize anchor", () => {
    const block: FinalizeReadinessBlock = {
      layer: "career-artifact",
      code: "skipped_must_questions",
      message: "2 required questions are unanswered.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action?.href).toContain("#architecture-assessment-progress");
    expect(action?.label).toBe("Complete required intake questions");
  });
});
