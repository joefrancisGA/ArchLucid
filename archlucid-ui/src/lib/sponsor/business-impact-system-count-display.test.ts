import { describe, expect, it } from "vitest";

import {
  businessImpactHasCommittedRuns,
  presentBusinessImpactSystemCountLabel,
} from "./business-impact-system-count-display";

describe("business-impact-system-count-display", () => {
  it("labels missing system count", () => {
    expect(presentBusinessImpactSystemCountLabel(undefined)).toBe("System count not returned");
    expect(businessImpactHasCommittedRuns(undefined)).toBe(false);
  });

  it("detects committed runs", () => {
    expect(businessImpactHasCommittedRuns(1)).toBe(true);
    expect(businessImpactHasCommittedRuns(0)).toBe(false);
  });
});
