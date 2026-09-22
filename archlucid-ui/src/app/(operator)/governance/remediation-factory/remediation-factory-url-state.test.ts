import { describe, expect, it } from "vitest";

import {
  remediationFactorySelectionHrefFromSearch,
  parseRemediationFactoryFindingIdFromSearch,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-url-state";

describe("remediation-factory-url-state", () => {
  it("parses findingId from search params", () => {
    expect(parseRemediationFactoryFindingIdFromSearch("finding-1")).toBe("finding-1");
    expect(parseRemediationFactoryFindingIdFromSearch("  ")).toBeNull();
  });

  it("writes selection params to the remediation factory href", () => {
    expect(
      remediationFactorySelectionHrefFromSearch(
        "",
        { findingId: "finding-1", pathId: null },
        "/security/remediation-factory",
      ),
    ).toBe("/security/remediation-factory?findingId=finding-1");

    expect(
      remediationFactorySelectionHrefFromSearch(
        "findingId=a",
        { fromSnapshot: "from-1", toSnapshot: "to-1" },
        "/security/remediation-factory",
      ),
    ).toBe("/security/remediation-factory?findingId=a&fromSnapshot=from-1&toSnapshot=to-1");
  });
});
