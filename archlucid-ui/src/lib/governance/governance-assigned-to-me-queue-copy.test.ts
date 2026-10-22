import { describe, expect, it } from "vitest";

import {
  governanceFindingsQueueRecordColumnLabel,
  governanceFindingsQueueTableAriaLabel,
  governanceFindingsQueueViewRecordCta,
} from "@/lib/governance/governance-assigned-to-me-queue-copy";

describe("governance-assigned-to-me-queue-copy", () => {
  it("uses finding vocabulary in assigned-to-me mode", () => {
    expect(governanceFindingsQueueRecordColumnLabel("assigned-to-me")).toBe("Finding");
    expect(governanceFindingsQueueViewRecordCta("assigned-to-me")).toBe("View finding");
    expect(governanceFindingsQueueTableAriaLabel("assigned-to-me")).toBe("Assigned findings");
  });

  it("keeps risk vocabulary in tenant mode", () => {
    expect(governanceFindingsQueueRecordColumnLabel("tenant")).toBe("Risk");
    expect(governanceFindingsQueueViewRecordCta("tenant")).toBe("View risk");
    expect(governanceFindingsQueueTableAriaLabel("tenant")).toBe("Findings");
  });
});
