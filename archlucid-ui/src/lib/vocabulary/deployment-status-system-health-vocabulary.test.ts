import { describe, expect, it } from "vitest";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { INTERNAL_DEPLOYMENT_STATUS_PATH } from "@/lib/internal-ops-route-paths";
import {
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK,
  DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO,
  buildDeploymentStatusSystemHealthVocabulary,
  resolveDeploymentStatusSystemHealthPeerLink,
} from "@/lib/vocabulary/deployment-status-system-health-vocabulary";

describe("deployment-status-system-health-vocabulary (TB-2287)", () => {
  it("explains why deployment status and system health stay separate and deep-links both", () => {
    const model = buildDeploymentStatusSystemHealthVocabulary();

    expect(model.heading).toBe(DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING);
    expect(model.whyTwo).toBe(DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("release");
    expect(model.whyTwo.toLowerCase()).toContain("probe");
    expect(model.compactLine).toBe(DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE);

    expect(model.deploymentStatusLink).toEqual(DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK);
    expect(model.deploymentStatusLink.href).toBe(INTERNAL_DEPLOYMENT_STATUS_PATH);
    expect(model.deploymentStatusLink.href).toBe("/internal/deployment-status");

    expect(model.systemHealthLink).toEqual(DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK);
    expect(model.systemHealthLink.href).toBe(ADMINISTRATION_SYSTEM_HEALTH_PATH);
    expect(model.systemHealthLink.href).toBe("/administration/system-health");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveDeploymentStatusSystemHealthPeerLink("deployment-status")).toEqual(
      DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK,
    );
    expect(resolveDeploymentStatusSystemHealthPeerLink("system-health")).toEqual(
      DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK,
    );
  });
});
