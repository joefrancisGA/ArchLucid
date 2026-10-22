import { afterEach, describe, expect, it, vi } from "vitest";

describe("review-pipeline-debug-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to disabled", async () => {
    const { isReviewPipelineDebugEnabled } = await import("@/lib/review-pipeline-debug-policy");

    expect(isReviewPipelineDebugEnabled()).toBe(false);
  });

  it("enables when NEXT_PUBLIC_REVIEW_PIPELINE_DEBUG=1", async () => {
    vi.stubEnv("NEXT_PUBLIC_REVIEW_PIPELINE_DEBUG", "1");
    const { isReviewPipelineDebugEnabled } = await import("@/lib/review-pipeline-debug-policy");

    expect(isReviewPipelineDebugEnabled()).toBe(true);
  });
});
