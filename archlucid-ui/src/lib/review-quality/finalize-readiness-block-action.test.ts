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

  it("deep-links existential assumption blocks to the activity finalize anchor", () => {
    const block: FinalizeReadinessBlock = {
      layer: "integrity",
      code: "existential_assumption",
      message: "1 existential assumption still needs confirmation before finalize.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action?.href).toContain("#architecture-assessment-progress");
    expect(action?.label).toBe("Acknowledge assumptions");
  });

  it("deep-links agent output quality blocks to the activity tab", () => {
    const block: FinalizeReadinessBlock = {
      layer: "integrity",
      code: "agent_output_quality",
      message: "Commit blocked: agent output quality gate rejected one or more traces.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action).toEqual({
      href: "/architecture/reviews/run-123?reviewTab=activity",
      label: "Review agent output quality",
    });
  });

  it("deep-links unsupported semantic support blocks to findings", () => {
    const block: FinalizeReadinessBlock = {
      layer: "integrity",
      code: "unsupported_semantic_support",
      message: "Semantic support hold still applies.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action).toEqual({
      href: "/architecture/reviews/run-123?reviewTab=findings",
      label: "Review semantic support gaps",
    });
  });

  it("deep-links evidence referential integrity blocks to findings", () => {
    const block: FinalizeReadinessBlock = {
      layer: "integrity",
      code: "evidence_referential_integrity",
      message: "Commit blocked: finding evidence referential integrity failed.",
    };

    const action = resolveFinalizeReadinessBlockAction("run-123", block);

    expect(action).toEqual({
      href: "/architecture/reviews/run-123?reviewTab=findings",
      label: "Review finding evidence linkage",
    });
  });
});
