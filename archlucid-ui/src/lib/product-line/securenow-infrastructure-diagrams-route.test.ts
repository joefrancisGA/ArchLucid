import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  infrastructureDiagramsPathForProductLine,
  isInfrastructureDiagramsRoutePath,
} from "@/lib/product-line/securenow-infrastructure-diagrams-route";

describe("securenow-infrastructure-diagrams-route", () => {
  it("routes SecureNow to /infrastructure/diagrams and Architecture to governance", () => {
    expect(infrastructureDiagramsPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH);
    expect(infrastructureDiagramsPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH);
  });

  it("recognizes both governance and SecureNow inventory diagrams paths", () => {
    expect(isInfrastructureDiagramsRoutePath(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH)).toBe(true);
    expect(isInfrastructureDiagramsRoutePath(SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH)).toBe(true);
    expect(isInfrastructureDiagramsRoutePath("/governance/infrastructure/drift")).toBe(false);
  });
});
