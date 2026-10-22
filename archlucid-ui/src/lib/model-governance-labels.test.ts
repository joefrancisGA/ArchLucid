import { describe, expect, it } from "vitest";

import { modelGovernanceAgentTypeLabel } from "@/lib/model-governance-labels";

describe("modelGovernanceAgentTypeLabel", () => {
  it("maps known agent roles", () => {
    expect(modelGovernanceAgentTypeLabel("Topology")).toBe("Architecture structure");
    expect(modelGovernanceAgentTypeLabel("Cost")).toBe("Cost");
    expect(modelGovernanceAgentTypeLabel("Compliance")).toBe("Compliance");
    expect(modelGovernanceAgentTypeLabel("Critic")).toBe("Critic");
  });

  it("humanizes unknown PascalCase agent roles", () => {
    expect(modelGovernanceAgentTypeLabel("SecurityReviewer")).toBe("Security Reviewer");
  });

  it("returns a fallback for blank values", () => {
    expect(modelGovernanceAgentTypeLabel("   ")).toBe("Unknown agent role");
  });
});
