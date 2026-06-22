import { afterEach, describe, expect, it } from "vitest";

import {
  FROM_GENERATION_QUERY_KEY,
  buildReviewGenerationRedirect,
  clearReviewGenerationHandoff,
  isFromGenerationSearchParam,
  readReviewGenerationHandoff,
  recordReviewGenerationHandoff,
  reviewDetailHrefAfterGeneration,
} from "@/lib/review-generation-handoff";

const RUN_ID = "11111111-1111-1111-1111-111111111111";

describe("review-generation-handoff", () => {
  afterEach(() => {
    clearReviewGenerationHandoff(RUN_ID);
  });

  it("builds generation redirect href with query flag", () => {
    expect(reviewDetailHrefAfterGeneration(RUN_ID)).toBe(
      `/reviews/${encodeURIComponent(RUN_ID)}?${FROM_GENERATION_QUERY_KEY}=1`,
    );
  });

  it("records and reads handoff context in sessionStorage", () => {
    recordReviewGenerationHandoff(RUN_ID, "quick-review", { jobId: "job-1" });

    const record = readReviewGenerationHandoff(RUN_ID);

    expect(record).not.toBeNull();
    expect(record?.runId).toBe(RUN_ID);
    expect(record?.source).toBe("quick-review");
    expect(record?.jobId).toBe("job-1");
    expect(record?.recordedAtUtc.length).toBeGreaterThan(0);
  });

  it("buildReviewGenerationRedirect records before returning href", () => {
    const href = buildReviewGenerationRedirect(RUN_ID, "socratic-intake");

    expect(href).toContain(`${FROM_GENERATION_QUERY_KEY}=1`);
    expect(readReviewGenerationHandoff(RUN_ID)?.source).toBe("socratic-intake");
  });

  it("detects fromGeneration search param", () => {
    expect(isFromGenerationSearchParam("1")).toBe(true);
    expect(isFromGenerationSearchParam("true")).toBe(true);
    expect(isFromGenerationSearchParam(undefined)).toBe(false);
    expect(isFromGenerationSearchParam("0")).toBe(false);
  });
});
