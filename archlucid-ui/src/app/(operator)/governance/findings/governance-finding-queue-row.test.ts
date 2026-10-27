import { describe, expect, it } from "vitest";

import {
  formatGovernanceQueueRecordRoleHonesty,
  GOVERNANCE_QUEUE_RECORD_ROLE_DECISION_HONESTY,
} from "@/app/(operator)/governance/findings/governance-finding-queue-row";

describe("governance-finding-queue-row (P-16)", () => {
  it("explains decision rows do not use finding severity or confidence", () => {
    expect(formatGovernanceQueueRecordRoleHonesty("decision")).toBe(
      GOVERNANCE_QUEUE_RECORD_ROLE_DECISION_HONESTY,
    );
  });
});
