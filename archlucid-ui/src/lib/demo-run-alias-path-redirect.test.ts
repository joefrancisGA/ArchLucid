import { describe, expect, it } from "vitest";

import { demoRunAliasRedirectDestinationPath } from "./demo-run-alias-path-redirect";

describe("demoRunAliasRedirectDestinationPath", () => {
  it("maps /runs alias to canonical /architecture/reviews while preserving deep paths", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/runs/claims-intake-modernization-run/findings/phi-minimization-risk/inspect",
      ),
    ).toBe("/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect");
  });

  it("maps /architecture/reviews alias while preserving deep paths (layout could otherwise strip the tail)", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/architecture/reviews/claims-intake-modernization-run/findings/phi-minimization-risk/inspect",
      ),
    ).toBe("/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect");
  });

  it("returns null when no alias rewrite is needed", () => {
    expect(demoRunAliasRedirectDestinationPath("/architecture/reviews/claims-intake-modernization")).toBeNull();
    expect(demoRunAliasRedirectDestinationPath("/runs/other-run-id")).toBeNull();
  });
});
