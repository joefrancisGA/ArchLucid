import { describe, expect, it } from "vitest";

import { findingEvidenceTraceLegacyRedirectPath } from "@/lib/finding-evidence-navigation";

describe("inspect legacy redirect", () => {
  it("maps showcase inspect URL to evidence-trace", () => {
    expect(
      findingEvidenceTraceLegacyRedirectPath(
        "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect",
      ),
    ).toBe("/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/evidence-trace");
  });
});
