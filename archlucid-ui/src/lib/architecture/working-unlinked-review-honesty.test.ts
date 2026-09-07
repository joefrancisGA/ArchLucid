import { describe, expect, it } from "vitest";

import {
  WORKING_UNLINKED_REVIEW_HONESTY_COPY,
  WORKING_UNLINKED_REVIEW_INBOX_LABEL,
  isUnlinkedArchitectureReviewJob,
} from "@/lib/architecture/working-unlinked-review-honesty";

describe("working unlinked review honesty (AO-49)", () => {
  it("treats null architecture id as unlinked", () => {
    expect(isUnlinkedArchitectureReviewJob(null)).toBe(true);
    expect(isUnlinkedArchitectureReviewJob("  ")).toBe(true);
    expect(isUnlinkedArchitectureReviewJob("architecture-identity-001")).toBe(false);
  });

  it("uses inbox honesty copy without implying a fake parent", () => {
    expect(WORKING_UNLINKED_REVIEW_INBOX_LABEL).toBe("Unlinked review");
    expect(WORKING_UNLINKED_REVIEW_HONESTY_COPY.toLowerCase()).toContain("will not invent");
  });
});
