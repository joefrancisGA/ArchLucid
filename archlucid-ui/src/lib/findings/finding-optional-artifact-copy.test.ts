import { describe, expect, it } from "vitest";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { resolveFindingOptionalArtifactUnavailableCopy } from "@/lib/findings/finding-optional-artifact-copy";

function notFoundFailure(): ApiLoadFailureState {
  return {
    message: "Request failed (404)",
    httpStatus: 404,
    correlationId: "corr-404",
    problem: { status: 404, title: "Not Found", detail: "missing" },
  };
}

describe("resolveFindingOptionalArtifactUnavailableCopy", () => {
  it("returns sample-review copy for explainability 404 without retry", () => {
    const copy = resolveFindingOptionalArtifactUnavailableCopy("explainability-trace", notFoundFailure(), {
      buyerPolishedShell: true,
      sampleReview: true,
    });

    expect(copy.heading).toContain("Explainability");
    expect(copy.body).toContain("sample review");
    expect(copy.body).not.toContain("404");
    expect(copy.showRetry).toBe(false);
  });

  it("returns retry guidance for transient audit failures", () => {
    const failure: ApiLoadFailureState = {
      message: "Service unavailable",
      httpStatus: 503,
      correlationId: "corr-503",
      problem: { status: 503, title: "Unavailable" },
    };

    const copy = resolveFindingOptionalArtifactUnavailableCopy("audit-record", failure, {
      buyerPolishedShell: true,
    });

    expect(copy.showRetry).toBe(true);
    expect(copy.body).not.toContain("503");
  });
});
