import { describe, expect, it } from "vitest";

import { demoRunAliasRedirectDestinationPath } from "./demo-run-alias-path-redirect";

describe("demoRunAliasRedirectDestinationPath", () => {
  it("maps /runs alias to canonical /reviews while preserving deep paths", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/runs/claims-intake-modernization-run/findings/phi-minimization-risk/inspect",
      ),
    ).toBe("/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect");
  });

  it("maps /reviews alias while preserving deep paths (layout could otherwise strip the tail)", () => {
    expect(
      demoRunAliasRedirectDestinationPath(
        "/reviews/claims-intake-modernization-run/findings/phi-minimization-risk/inspect",
      ),
    ).toBe("/reviews/claims-intake-modernization/findings/phi-minimization-risk/inspect");
  });

  it("maps executive alias while preserving deep paths", () => {
    expect(
      demoRunAliasRedirectDestinationPath("/executive/reviews/claims-intake-modernization-run/provenance"),
    ).toBe("/executive/reviews/claims-intake-modernization/provenance");
  });

  it("returns null when no alias rewrite is needed", () => {
    expect(demoRunAliasRedirectDestinationPath("/reviews/claims-intake-modernization")).toBeNull();
    expect(demoRunAliasRedirectDestinationPath("/runs/other-run-id")).toBeNull();
  });
});
