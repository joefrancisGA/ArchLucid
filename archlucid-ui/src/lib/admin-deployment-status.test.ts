import { describe, expect, it } from "vitest";

import {
  ADMIN_DEPLOYMENT_STATUS_PROXY_PATH,
  buildDeploymentStatusRequestUrl,
  DEPLOYMENT_STATUS_UNKNOWN,
  deploymentOverallStatusShortLabel,
  deploymentOverallStatusTagKind,
  displayDeploymentField,
  resolveOverallTone,
} from "./admin-deployment-status";

describe("admin-deployment-status helpers", () => {
  it("maps empty and unknown values to Unknown", () => {
    expect(displayDeploymentField(undefined)).toBe(DEPLOYMENT_STATUS_UNKNOWN);
    expect(displayDeploymentField("")).toBe(DEPLOYMENT_STATUS_UNKNOWN);
    expect(displayDeploymentField("unknown")).toBe(DEPLOYMENT_STATUS_UNKNOWN);
    expect(displayDeploymentField("abc123")).toBe("abc123");
  });

  it("resolves overall tone without inventing Healthy", () => {
    expect(resolveOverallTone("Healthy")).toBe("Healthy");
    expect(resolveOverallTone("Warning")).toBe("Warning");
    expect(resolveOverallTone("Failed")).toBe("Failed");
    expect(resolveOverallTone("")).toBe("Unknown");
    expect(resolveOverallTone("Degraded")).toBe("Unknown");
  });

  it("includes frontendBuildId only when known", () => {
    expect(buildDeploymentStatusRequestUrl("")).toBe(ADMIN_DEPLOYMENT_STATUS_PROXY_PATH);
    expect(buildDeploymentStatusRequestUrl("unknown")).toBe(ADMIN_DEPLOYMENT_STATUS_PROXY_PATH);
    expect(buildDeploymentStatusRequestUrl("deadbeef")).toBe(
      `${ADMIN_DEPLOYMENT_STATUS_PROXY_PATH}?frontendBuildId=deadbeef`,
    );
  });

  it("maps deployment overall tone to StatusTag kind and short label", () => {
    expect(deploymentOverallStatusTagKind("Healthy")).toBe("ready");
    expect(deploymentOverallStatusTagKind("Warning")).toBe("needs-attention");
    expect(deploymentOverallStatusTagKind("Failed")).toBe("blocked");
    expect(deploymentOverallStatusTagKind("Unknown")).toBe("neutral");
    expect(deploymentOverallStatusShortLabel("Healthy")).toBe("Healthy");
    expect(deploymentOverallStatusShortLabel("Failed")).toBe("Failed");
  });
});
