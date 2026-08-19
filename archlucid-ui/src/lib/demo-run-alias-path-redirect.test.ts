import { describe, expect, it } from "vitest";

import { demoRunAliasRedirectDestinationPath } from "./demo-run-alias-path-redirect";

describe("demoRunAliasRedirectDestinationPath", () => {
  it("maps /runs alias to canonical /architecture/reviews while preserving deep paths", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/runs/customer-intake-modernization-run/findings/sensitive-data-minimization-risk/evidence-trace",
      ),
    ).toBe("/architecture/reviews/customer-intake-modernization/findings/sensitive-data-minimization-risk/evidence-trace");
  });

  it("maps /architecture/reviews alias while preserving deep paths (layout could otherwise strip the tail)", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/architecture/reviews/customer-intake-modernization-run/findings/sensitive-data-minimization-risk/evidence-trace",
      ),
    ).toBe("/architecture/reviews/customer-intake-modernization/findings/sensitive-data-minimization-risk/evidence-trace");
  });

  it("returns null when no alias rewrite is needed", () => {
    expect(demoRunAliasRedirectDestinationPath("/architecture/reviews/customer-intake-modernization")).toBeNull();
    expect(demoRunAliasRedirectDestinationPath("/runs/other-run-id")).toBeNull();
  });
});
