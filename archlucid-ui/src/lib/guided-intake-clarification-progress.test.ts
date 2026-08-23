import { describe, expect, it } from "vitest";

import {
  mergeAdmittedRequiredMustQuestionKeys,
  resolveGuidedIntakeClarificationProgress,
} from "./guided-intake-clarification-progress";

describe("resolveGuidedIntakeClarificationProgress", () => {
  const mustQuestions = [
    {
      questionKey: "l0.pillar.security",
      prompt: "Security",
      tier: "Must" as const,
      answerKind: "FreeText" as const,
      source: "L0Universal" as const,
      ruleKeys: [],
    },
    {
      questionKey: "l0.pillar.reliability",
      prompt: "Reliability",
      tier: "Must" as const,
      answerKind: "FreeText" as const,
      source: "L0Universal" as const,
      ruleKeys: [],
    },
  ];

  it("uses admitted document keys when every clarification is already answered", () => {
    const progress = resolveGuidedIntakeClarificationProgress({
      admittedRequiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
      pendingSelectionRequiredKeys: [],
      allQuestions: mustQuestions,
      activePendingCount: 0,
    });

    expect(progress.totalRequired).toBe(2);
    expect(progress.handledCount).toBe(2);
  });

  it("falls back to MUST catalog size when selection APIs return empty pending sets", () => {
    const progress = resolveGuidedIntakeClarificationProgress({
      admittedRequiredMustQuestionKeys: [],
      pendingSelectionRequiredKeys: [],
      allQuestions: mustQuestions,
      activePendingCount: 0,
    });

    expect(progress.totalRequired).toBe(2);
    expect(progress.handledCount).toBe(2);
  });

  it("counts partially handled clarifications from active pending rows", () => {
    const progress = resolveGuidedIntakeClarificationProgress({
      admittedRequiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
      pendingSelectionRequiredKeys: ["l0.pillar.reliability"],
      allQuestions: mustQuestions,
      activePendingCount: 1,
    });

    expect(progress.totalRequired).toBe(2);
    expect(progress.handledCount).toBe(1);
  });
});

describe("mergeAdmittedRequiredMustQuestionKeys", () => {
  it("keeps the longer admitted key list when refresh returns fewer keys", () => {
    expect(
      mergeAdmittedRequiredMustQuestionKeys(
        ["l0.pillar.security", "l0.pillar.reliability"],
        ["l0.pillar.security"],
      ),
    ).toEqual(["l0.pillar.security", "l0.pillar.reliability"]);
  });

  it("accepts a longer document baseline when state was empty", () => {
    expect(
      mergeAdmittedRequiredMustQuestionKeys([], ["l0.pillar.security", "l0.pillar.reliability"]),
    ).toEqual(["l0.pillar.security", "l0.pillar.reliability"]);
  });
});
