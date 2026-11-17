import { describe, expect, it } from "vitest";

import { resolveEvidenceGraphReviewPackageHref } from "@/lib/evidence-graph-review-package-href";

describe("resolveEvidenceGraphReviewPackageHref", () => {
  it("returns inbox href when run id is empty", () => {
    expect(resolveEvidenceGraphReviewPackageHref({ runId: "  " })).toBe("/architecture/reviews");
  });

  it("nests under architecture from query param", () => {
    expect(
      resolveEvidenceGraphReviewPackageHref({
        runId: "run-42",
        pathname: "/insights/evidence-graph",
        queryArchitectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-42");
  });
});
