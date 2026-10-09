import { describe, expect, it } from "vitest";

import { resolveFinalizedReviewRecordLabel } from "./RunDetailAuthorityChainSection";

describe("RunDetailAuthorityChainSection manifest label", () => {
  it("uses omission copy only when the manifest id is missing", () => {
    expect(resolveFinalizedReviewRecordLabel(null)).toBe("Finalized review record was not stored.");
    expect(resolveFinalizedReviewRecordLabel("   ")).toBe("Finalized review record was not stored.");
    expect(resolveFinalizedReviewRecordLabel("manifest-1")).toBe("Finalized review record");
  });
});
