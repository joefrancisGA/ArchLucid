import { describe, expect, it } from "vitest";

import { governanceFindingsNlFacetsHrefFromSearch } from "./governance-findings-queue-nl-facets-url";

describe("governanceFindingsNlFacetsHrefFromSearch", () => {
  it("retains hideGeneric when NL facet chips change", () => {
    const href = governanceFindingsNlFacetsHrefFromSearch("hideGeneric=1", {
      severity: "high",
      status: "open",
      titleKeywords: [],
    });

    expect(href).toBe("/governance/findings?hideGeneric=1&severity=high&status=open");
  });
});
