import { describe, expect, it } from "vitest";

import { resolveReviewWorkspaceLifecycleProgressStep } from "@/lib/reviews/review-workspace-lifecycle-progress-copy";

describe("resolveReviewWorkspaceLifecycleProgressStep", () => {
  it("maps finalized lifecycle to post-finalize", () => {
    expect(resolveReviewWorkspaceLifecycleProgressStep("finalized")).toBe("post-finalize");
  });

  it("maps in-review lifecycle to evidence-findings", () => {
    expect(resolveReviewWorkspaceLifecycleProgressStep("in-review")).toBe("evidence-findings");
  });
});
