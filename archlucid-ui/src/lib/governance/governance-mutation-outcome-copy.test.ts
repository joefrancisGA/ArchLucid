import { describe, expect, it } from "vitest";

import {
  governanceBulkDispositionSuccessMessage,
  policyPackPublishSuccessMessage,
} from "@/lib/governance/governance-mutation-outcome-copy";

describe("governance-mutation-outcome-copy", () => {
  it("formats bulk disposition success labels", () => {
    expect(governanceBulkDispositionSuccessMessage(3, "Accepted")).toBe("Marked 3 finding(s) as accepted.");
    expect(governanceBulkDispositionSuccessMessage(1, "RejectedAsNotApplicable")).toBe("Marked 1 finding(s) as waived.");
    expect(governanceBulkDispositionSuccessMessage(2, "Deferred")).toBe("Marked 2 finding(s) as deferred.");
  });

  it("formats policy pack publish success", () => {
    expect(policyPackPublishSuccessMessage("1.2.0")).toBe("Policy pack version 1.2.0 published.");
    expect(policyPackPublishSuccessMessage("  ")).toBe("Policy pack version published.");
  });
});
