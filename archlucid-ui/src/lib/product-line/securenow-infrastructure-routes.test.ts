import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  infrastructureAskPathForProductLine,
  infrastructureDiagramReconcilePathForProductLine,
  infrastructureDriftPathForProductLine,
  infrastructureExtractUploadPathForProductLine,
  infrastructureOverviewPathForProductLine,
  infrastructureTerraformPathForProductLine,
} from "@/lib/product-line/securenow-infrastructure-routes";

describe("securenow-infrastructure-routes", () => {
  it("routes SecureNow infrastructure hubs to /infrastructure and Architecture to /governance/infrastructure", () => {
    expect(infrastructureOverviewPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_PATH);
    expect(infrastructureOverviewPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_PATH);
    expect(infrastructureDriftPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_DRIFT_PATH);
    expect(infrastructureDriftPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH);
    expect(infrastructureTerraformPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH);
    expect(infrastructureTerraformPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH);
    expect(infrastructureDiagramReconcilePathForProductLine("security")).toBe(
      SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    );
    expect(infrastructureDiagramReconcilePathForProductLine("architecture")).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    );
    expect(infrastructureAskPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_ASK_PATH);
    expect(infrastructureAskPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_ASK_PATH);
    expect(infrastructureExtractUploadPathForProductLine("security")).toBe(
      SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    );
    expect(infrastructureExtractUploadPathForProductLine("architecture")).toBe(
      GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    );
  });
});
