import { describe, expect, it } from "vitest";

import {
  remediationFactoryPathViewLabel,
  resolveRemediationFactoryPathViewForRankedPath,
} from "@/lib/governance/remediation-factory-path-view";

describe("remediation-factory-path-view", () => {
  it("maps ranked path kinds to path views", () => {
    expect(
      resolveRemediationFactoryPathViewForRankedPath({
        pathKind: "ReachabilityPath",
        pathConfidenceBand: "High",
      }),
    ).toBe("public-exposure");
    expect(
      resolveRemediationFactoryPathViewForRankedPath({
        pathKind: "PrivilegeEscalationPath",
        pathConfidenceBand: "High",
      }),
    ).toBe("privilege");
    expect(
      resolveRemediationFactoryPathViewForRankedPath({
        pathKind: "ReachabilityPath",
        pathConfidenceBand: "InsufficientEvidence",
      }),
    ).toBe("insufficient-evidence");
  });

  it("labels path views for operator copy", () => {
    expect(remediationFactoryPathViewLabel("public-exposure")).toBe("Public exposure");
  });
});
