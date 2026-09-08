import { describe, expect, it } from "vitest";

import {
  FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM,
  parseFinalizeSuccessHighlightReviewId,
  resolveFinalizeSuccessDeskHref,
} from "@/lib/architecture/finalize-success-desk-href";

describe("finalize success desk href (AO-35)", () => {
  it("builds architecture desk href with highlight query param", () => {
    expect(resolveFinalizeSuccessDeskHref("architecture-identity-001", "run-001")).toBe(
      `/architecture/architectures/architecture-identity-001?${FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM}=run-001`,
    );
  });

  it("parses highlight review id from search params", () => {
    const params = new URLSearchParams({ [FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM]: "run-001" });

    expect(parseFinalizeSuccessHighlightReviewId(params)).toBe("run-001");
    expect(parseFinalizeSuccessHighlightReviewId(new URLSearchParams())).toBeNull();
  });
});
