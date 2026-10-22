import { afterEach, describe, expect, it } from "vitest";

import {
  FROM_GENERATION_QUERY_KEY,
  REVIEW_PACKAGE_OPEN_FAILURE_HEADING,
  buildReviewGenerationRedirect,
  clearReviewGenerationHandoff,
  isFromGenerationSearchParam,
  readReviewGenerationHandoff,
  recordReviewGenerationHandoff,
  reviewDetailHrefAfterGeneration,
} from "@/lib/review-generation-handoff";
import { OPERATOR_SCOPE_COOKIE_NAME } from "@/lib/operator/operator-scope-cookie";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

const RUN_ID = "11111111-1111-1111-1111-111111111111";

describe("review-generation-handoff", () => {
  afterEach(() => {
    clearReviewGenerationHandoff(RUN_ID);
    localStorage.clear();
    document.cookie = `${OPERATOR_SCOPE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  });

  it("builds generation redirect href with query flag", () => {
    expect(reviewDetailHrefAfterGeneration(RUN_ID)).toBe(
      `/architecture/reviews/${encodeURIComponent(RUN_ID)}?${FROM_GENERATION_QUERY_KEY}=1`,
    );
  });

  it("adds create-architecture intent to generation redirect href", () => {
    expect(reviewDetailHrefAfterGeneration(RUN_ID, { architectureCreation: true })).toBe(
      `/architecture/reviews/${encodeURIComponent(RUN_ID)}?${FROM_GENERATION_QUERY_KEY}=1&intent=create-architecture`,
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
    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });
    const href = buildReviewGenerationRedirect(RUN_ID, "socratic-intake");

    expect(href).toContain(`${FROM_GENERATION_QUERY_KEY}=1`);
    expect(readReviewGenerationHandoff(RUN_ID)?.source).toBe("socratic-intake");
    expect(readReviewGenerationHandoff(RUN_ID)?.projectId).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
    expect(document.cookie).toContain(`${OPERATOR_SCOPE_COOKIE_NAME}=`);
  });

  it("uses buyer-safe open-failure heading without generation jargon", () => {
    expect(REVIEW_PACKAGE_OPEN_FAILURE_HEADING).toBe(
      "Architecture review — package could not be opened",
    );
    expect(REVIEW_PACKAGE_OPEN_FAILURE_HEADING.toLowerCase()).not.toContain("review generation");
    expect(REVIEW_PACKAGE_OPEN_FAILURE_HEADING.toLowerCase()).not.toContain("generated package");
  });

  it("detects fromGeneration search param", () => {
    expect(isFromGenerationSearchParam("1")).toBe(true);
    expect(isFromGenerationSearchParam("true")).toBe(true);
    expect(isFromGenerationSearchParam(undefined)).toBe(false);
    expect(isFromGenerationSearchParam("0")).toBe(false);
  });
});
