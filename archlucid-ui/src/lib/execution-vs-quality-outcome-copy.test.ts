import { describe, expect, it } from "vitest";

import {
  findForbiddenQualityOutagePhrases,
  plainLanguageRejectCategoryLabel,
  resolveExecutionVsQualityAxis,
  resolveLastFailureCardCopy,
  resolveQualityRejectedCommitBlockedReason,
} from "@/lib/execution-vs-quality-outcome-copy";

describe("execution-vs-quality-outcome-copy (TB-965)", () => {
  it("classifies qualityGate and ExecutionCompletedQualityRejected as quality axis", () => {
    expect(resolveExecutionVsQualityAxis({ failureClass: "qualityGate" })).toBe("quality");
    expect(
      resolveExecutionVsQualityAxis({ legacyRunStatus: "ExecutionCompletedQualityRejected" }),
    ).toBe("quality");
    expect(resolveExecutionVsQualityAxis({ failureClass: "timeout" })).toBe("execution");
  });

  it("uses distinct titles and remediation for quality vs execution", () => {
    const quality = resolveLastFailureCardCopy({
      failureClass: "qualityGate",
      triageScenarioId: "groundingInsufficiency",
      rejectReasonCategory: "faithfulness",
    });

    expect(quality.axis).toBe("quality");
    expect(quality.title).toContain("not an outage");
    expect(quality.remediation.toLowerCase()).toContain("enrich");
    expect(findForbiddenQualityOutagePhrases(quality.title + quality.remediation)).toEqual([]);

    const execution = resolveLastFailureCardCopy({
      failureClass: "timeout",
      triageScenarioId: "timeout",
    });

    expect(execution.axis).toBe("execution");
    expect(execution.title).toBe("Agent execution failed");
    expect(execution.remediation.toLowerCase()).toContain("retry");
  });

  it("maps reject categories to plain language without model jargon overload", () => {
    expect(plainLanguageRejectCategoryLabel("structural")).toMatch(/Structure/i);
    expect(plainLanguageRejectCategoryLabel("semantic")).toMatch(/Substance/i);
    expect(plainLanguageRejectCategoryLabel("faithfulness")).toMatch(/Grounding/i);
  });

  it("forbids outage phrases on quality commit-block copy", () => {
    const reason = resolveQualityRejectedCommitBlockedReason();

    expect(reason.toLowerCase()).toContain("not a platform outage");
    expect(findForbiddenQualityOutagePhrases(reason)).toEqual([]);
  });
});
