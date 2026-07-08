import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeGovernanceFindingsQueue,
} from "./governance-findings-queue-virtualization";

describe("governance-findings-queue-virtualization", () => {
  it("does not virtualize below the row threshold", () => {
    expect(shouldVirtualizeGovernanceFindingsQueue(0)).toBe(false);
    expect(shouldVirtualizeGovernanceFindingsQueue(GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS - 1)).toBe(false);
  });

  it("virtualizes at and above the row threshold", () => {
    expect(shouldVirtualizeGovernanceFindingsQueue(GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS)).toBe(true);
    expect(shouldVirtualizeGovernanceFindingsQueue(200)).toBe(true);
  });
});
