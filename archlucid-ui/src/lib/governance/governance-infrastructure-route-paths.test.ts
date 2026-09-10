import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  isGovernanceInfrastructureAskRoutePath,
  isGovernanceInfrastructureRoutePath,
} from "@/lib/governance/governance-infrastructure-route-paths";

describe("governance infrastructure route paths", () => {
  it("matches infrastructure hub and workbench routes", () => {
    expect(isGovernanceInfrastructureRoutePath(GOVERNANCE_INFRASTRUCTURE_PATH)).toBe(true);
    expect(isGovernanceInfrastructureRoutePath("/governance/infrastructure/drift")).toBe(true);
    expect(isGovernanceInfrastructureRoutePath("/governance/alerts")).toBe(false);
  });

  it("matches Ask routes only for Ask helper", () => {
    expect(isGovernanceInfrastructureAskRoutePath(GOVERNANCE_INFRASTRUCTURE_ASK_PATH)).toBe(true);
    expect(isGovernanceInfrastructureAskRoutePath("/governance/infrastructure/drift")).toBe(false);
  });
});
