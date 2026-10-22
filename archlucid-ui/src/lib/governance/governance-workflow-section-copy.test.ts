import { describe, expect, it } from "vitest";

import {
  governanceWorkflowOutcomeLineForPhase,
  GOVERNANCE_WORKFLOW_OUTCOME_APPROVED,
  GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS,
  GOVERNANCE_WORKFLOW_OUTCOME_PENDING,
} from "@/lib/governance/governance-workflow-section-copy";

describe("governanceWorkflowOutcomeLineForPhase", () => {
  it("suppresses completion messaging when no requests exist", () => {
    expect(governanceWorkflowOutcomeLineForPhase("no_requests")).toBe(GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS);
    expect(governanceWorkflowOutcomeLineForPhase("approved")).toBeNull();
  });

  it("describes pending and approved phases without contradicting request history", () => {
    expect(governanceWorkflowOutcomeLineForPhase("pending")).toBe(GOVERNANCE_WORKFLOW_OUTCOME_PENDING);
    expect(governanceWorkflowOutcomeLineForPhase("approved")).toBeNull();
    expect(GOVERNANCE_WORKFLOW_OUTCOME_APPROVED).toContain("supporting request history");
  });
});
