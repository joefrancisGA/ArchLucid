import type { RunDetail } from "@/types/authority";
import { describe, expect, it } from "vitest";

import {
  extractQuickDecisionFindingsFromRunDetail,
  firstRecommendationSentence,
  sortQuickDecisionFindings,
} from "./quick-decision-summary-derive";

describe("quick-decision-summary-derive", () => {
  it("firstRecommendationSentence returns first sentence when punctuation present", () => {
    expect(firstRecommendationSentence("Patch Redis. Rotate credentials.")).toBe("Patch Redis.");
    expect(firstRecommendationSentence("Alert now! Then verify.")).toBe("Alert now!");
    expect(firstRecommendationSentence("Question? Next step")).toBe("Question?");
  });

  it("firstRecommendationSentence returns full text when no sentence boundary", () => {
    expect(firstRecommendationSentence("No boundary here")).toBe("No boundary here");
  });

  it("extractQuickDecisionFindingsFromRunDetail preserves order and severity", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [
        {
          findings: [
            {
              findingId: "a",
              message: "Low issue",
              reasoningTrace: "Monitor closely.",
              severity: 0,
            },
            {
              findingId: "b",
              message: "Critical issue",
              reasoningTrace: "Block deploy. Fix ACL.",
              severity: 3,
            },
          ],
        },
        {
          findings: [
            {
              findingId: "c",
              category: "Cat only",
              reasoningTrace: "",
              severity: 2,
            },
          ],
        },
      ],
    } as unknown as RunDetail;

    const extracted = extractQuickDecisionFindingsFromRunDetail(detail);

    expect(extracted).toHaveLength(3);
    expect(extracted[0]?.findingId).toBe("a");
    expect(extracted[1]?.findingId).toBe("b");

    const sorted = sortQuickDecisionFindings(extracted);

    expect(sorted[0]?.findingId).toBe("b");
    expect(sorted[1]?.findingId).toBe("c");
    expect(sorted[2]?.findingId).toBe("a");
  });

  it("extractQuickDecisionFindingsFromRunDetail skips rows without findingId", () => {
    const detail = {
      run: { runId: "r1", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" },
      results: [{ findings: [{ findingId: "", message: "x" }] }],
    } as unknown as RunDetail;

    expect(extractQuickDecisionFindingsFromRunDetail(detail)).toHaveLength(0);
  });
});
