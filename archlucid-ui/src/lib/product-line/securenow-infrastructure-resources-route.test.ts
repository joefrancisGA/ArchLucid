import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  infrastructureResourceHubPathForProductLine,
  infrastructureResourcesPathForProductLine,
  isInfrastructureResourcesRoutePath,
} from "@/lib/product-line/securenow-infrastructure-resources-route";

describe("securenow-infrastructure-resources-route", () => {
  it("resolves product-line canonical resource explorer paths", () => {
    expect(infrastructureResourcesPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH);
    expect(infrastructureResourcesPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH);
  });

  it("resolves product-line canonical resource hub paths", () => {
    expect(infrastructureResourceHubPathForProductLine("security", "res-1")).toBe(
      "/infrastructure/resources/res-1",
    );
    expect(infrastructureResourceHubPathForProductLine("architecture", "res-1")).toBe(
      "/governance/infrastructure/resources/res-1",
    );
  });

  it("matches governance and SecureNow resource routes", () => {
    expect(isInfrastructureResourcesRoutePath(GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH)).toBe(true);
    expect(isInfrastructureResourcesRoutePath(SECURENOW_INFRASTRUCTURE_RESOURCES_PATH)).toBe(true);
    expect(isInfrastructureResourcesRoutePath("/infrastructure/resources/res-1")).toBe(true);
    expect(isInfrastructureResourcesRoutePath("/governance/infrastructure/drift")).toBe(false);
  });
});
