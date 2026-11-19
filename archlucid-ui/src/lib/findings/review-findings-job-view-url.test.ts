import { describe, expect, it } from "vitest";

import {
  buildReviewFindingsTabHref,
  resolveFindingJobViewFromSearchParam,
  reviewFindingsJobViewHrefFromSearch,
} from "@/lib/findings/review-findings-job-view-url";

describe("review-findings-job-view-url", () => {
  it("builds findings tab href with job view param when not default", () => {
    expect(buildReviewFindingsTabHref("run-1", "verify-hypotheses")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingJobView=verify-hypotheses",
    );
  });

  it("omits job view param for default lane", () => {
    expect(buildReviewFindingsTabHref("run-1", "needs-my-decision")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings",
    );
  });

  it("falls back to default for unknown search param values", () => {
    expect(resolveFindingJobViewFromSearchParam("not-a-lane")).toBe("needs-my-decision");
    expect(resolveFindingJobViewFromSearchParam("verify-hypotheses")).toBe("verify-hypotheses");
  });

  it("retains triage focusedFinding when job view changes on the findings queue", () => {
    const href = reviewFindingsJobViewHrefFromSearch(
      "focusedFinding=finding-1&filter=open",
      "/governance/findings",
      "needs-governance",
    );

    expect(href).toBe(
      "/governance/findings?focusedFinding=finding-1&filter=open&findingJobView=needs-governance",
    );
  });

  it("retains hideGeneric when job view changes on the findings queue", () => {
    const href = reviewFindingsJobViewHrefFromSearch(
      "hideGeneric=1&filter=open",
      "/governance/findings",
      "needs-governance",
    );

    expect(href).toBe("/governance/findings?hideGeneric=1&filter=open&findingJobView=needs-governance");
  });

  it("clears armed preset-remove confirm when job view changes on the findings queue", () => {
    const href = reviewFindingsJobViewHrefFromSearch(
      "removePresetId=preset-1&filter=open",
      "/governance/findings",
      "needs-governance",
    );

    expect(href).toBe("/governance/findings?filter=open&findingJobView=needs-governance");
    expect(href).not.toContain("removePresetId=");
  });

  it("retains triage focusedFinding when job view clears to default", () => {
    const href = reviewFindingsJobViewHrefFromSearch(
      "focusedFinding=finding-1&findingJobView=needs-governance&filter=open",
      "/governance/findings",
      "needs-my-decision",
    );

    expect(href).toBe("/governance/findings?focusedFinding=finding-1&filter=open");
    expect(href).not.toContain("findingJobView=");
  });
});
