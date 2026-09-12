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

  it.each([
    {
      code: "lifecycle_phase_incomplete",
      layer: "integrity",
      message: "Pipeline must be Complete before seal.",
      href: "/architecture/reviews/run-123?reviewTab=activity",
      label: "Complete the review pipeline",
    },
    {
      code: "decision_grade_provenance",
      layer: "integrity",
      message: "Finding provenance is incomplete.",
      href: "/architecture/reviews/run-123?reviewTab=findings",
      label: "Review finding provenance",
    },
    {
      code: "structural_execution_mode",
      layer: "integrity",
      message: "Structural execution mode is Mixed.",
      href: "/architecture/reviews/run-123?reviewTab=activity",
      label: "Review execution mode",
    },
    {
      code: "degraded_finding_coverage",
      layer: "career-artifact",
      message: "Finding coverage is degraded.",
      href: "/architecture/reviews/run-123?reviewTab=activity",
      label: "Review finding engine coverage",
    },
    {
      code: "transparency_trail_incomplete",
      layer: "career-artifact",
      message: "Transparency trail is incomplete.",
      hrefMatcher: "#architecture-assessment-progress",
      label: "Review intake provenance",
    },
    {
      code: "pre_commit_gate",
      layer: "governance",
      message: "Critical findings exceed threshold.",
      hrefMatcher: "#architecture-assessment-progress",
      label: "Review pre-commit gate",
    },
    {
      code: "scorecard",
      layer: "scorecard",
      message: "2 open contradictions remain.",
      href: "/architecture/reviews/run-123?reviewTab=findings&findingJobView=resolve-contradictions",
      label: "Resolve contradictions",
    },
  ] as const)(
    "deep-links $code blocks to the expected review destination",
    ({ code, layer, message, href, hrefMatcher, label }) => {
      const block: FinalizeReadinessBlock = { layer, code, message };
      const action = resolveFinalizeReadinessBlockAction("run-123", block);

      expect(action?.label).toBe(label);

      if (href !== undefined) {
        expect(action?.href).toBe(href);
      }

      if (hrefMatcher !== undefined) {
        expect(action?.href).toContain(hrefMatcher);
      }
    },
  );
});
