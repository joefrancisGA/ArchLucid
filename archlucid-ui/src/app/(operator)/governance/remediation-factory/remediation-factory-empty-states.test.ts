import { describe, expect, it } from "vitest";

import {
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
  resolveRemediationFactoryRankedPathsEmptyState,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-empty-states";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

describe("resolveRemediationFactoryRankedPathsEmptyState", () => {
  it("prefers cloud collection when setup is incomplete", () => {
    const state = resolveRemediationFactoryRankedPathsEmptyState(false);

    expect(state.actions?.[0]?.label).toBe("Open collection");
    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(state.actions?.[0]?.variant).toBe("primary");
    expect(state.actions?.[1]?.href).toBe(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH);
  });

  it("keeps upload inventory primary when collection is complete", () => {
    expect(resolveRemediationFactoryRankedPathsEmptyState(true)).toEqual(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY);
  });
});
