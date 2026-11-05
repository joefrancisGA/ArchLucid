import { describe, expect, it } from "vitest";

import { resolveSignedRecordsListReviewHref } from "@/lib/resolve-signed-records-list-review-href";

describe("resolveSignedRecordsListReviewHref", () => {
  it("uses request id as architecture parent when registry does not resolve", () => {
    expect(
      resolveSignedRecordsListReviewHref({
        runId: "run-abc",
        requestId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc");
  });

  it("falls back to peer inbox when no architecture context is stored", () => {
    expect(
      resolveSignedRecordsListReviewHref({
        runId: "run-peer",
        requestId: null,
      }),
    ).toBe("/architecture/reviews/run-peer");
  });
});
