import { describe, expect, it } from "vitest";

import { resolveClarificationFollowUpHref } from "@/lib/architecture/resolve-clarification-follow-up-href";
import { SECOND_REVIEW_RERUN_QUERY_PARAM } from "@/lib/second-review-prior-package";

describe("resolveClarificationFollowUpHref", () => {
  it("prefers rerun query param for prior package handoff", () => {
    const href = resolveClarificationFollowUpHref({
      runId: "cccccccccccccccccccccccccccccccc",
      priorRunId: "dddddddddddddddddddddddddddddddd",
      questionId: "abc123def4567890",
    });

    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get(SECOND_REVIEW_RERUN_QUERY_PARAM)).toBe("cccccccccccccccccccccccccccccccc");
    expect(url.searchParams.get("priorRunId")).toBe("dddddddddddddddddddddddddddddddd");
    expect(url.searchParams.get("clarificationQuestionId")).toBe("abc123def4567890");
  });
});
