import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_BLOCKING_FINDING_COUNT_NOT_STORED_LABEL,
  isGovernanceBlockingFindingCountStored,
} from "@/lib/governance/governance-blocking-finding-count-display";

describe("governance-blocking-finding-count-display", () => {
  it("treats finite manifest unresolved counts as stored", () => {
    expect(isGovernanceBlockingFindingCountStored(0)).toBe(true);
    expect(isGovernanceBlockingFindingCountStored(2)).toBe(true);
    expect(isGovernanceBlockingFindingCountStored(null)).toBe(false);
    expect(isGovernanceBlockingFindingCountStored(undefined)).toBe(false);
  });

  it("exposes stable omission copy", () => {
    expect(GOVERNANCE_BLOCKING_FINDING_COUNT_NOT_STORED_LABEL).toBe(
      "Blocking finding count was not stored.",
    );
  });
});
