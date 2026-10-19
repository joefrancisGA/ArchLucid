import { describe, expect, it } from "vitest";

import {
  remediationFactorySelectionHrefFromSearch,
  parseRemediationFactoryFindingIdFromSearch,
  parseRemediationFactoryRankedPageFromSearch,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-url-state";

describe("remediation-factory-url-state", () => {
  it("parses findingId from search params", () => {
    expect(parseRemediationFactoryFindingIdFromSearch("finding-1")).toBe("finding-1");
    expect(parseRemediationFactoryFindingIdFromSearch("  ")).toBeNull();
  });

  it("parses rankedPage from search params", () => {
    expect(parseRemediationFactoryRankedPageFromSearch("2")).toBe(2);
    expect(parseRemediationFactoryRankedPageFromSearch("0")).toBe(1);
    expect(parseRemediationFactoryRankedPageFromSearch("x")).toBe(1);
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

    expect(
      remediationFactorySelectionHrefFromSearch("", { rankedPage: 2 }, "/security/remediation-factory"),
    ).toBe("/security/remediation-factory?rankedPage=2");

    expect(
      remediationFactorySelectionHrefFromSearch("rankedPage=3", { rankedPage: 1 }, "/security/remediation-factory"),
    ).toBe("/security/remediation-factory");
  });
});
