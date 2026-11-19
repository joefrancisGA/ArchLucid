import { describe, expect, it } from "vitest";

import { governanceFindingsHideGenericHrefFromSearch } from "./governance-findings-hide-generic-url";

describe("governanceFindingsHideGenericHrefFromSearch", () => {
  it("retains triage focusedFinding when hide-generic density toggles", () => {
    const href = governanceFindingsHideGenericHrefFromSearch(
      "focusedFinding=finding-1&filter=open",
      true,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?focusedFinding=finding-1&filter=open&hideGeneric=1");
  });
});
