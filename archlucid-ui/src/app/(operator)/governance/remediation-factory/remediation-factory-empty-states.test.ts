import { describe, expect, it } from "vitest";

import {
  REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
  resolveRemediationFactoryPriorityQueueEmptyState,
  resolveRemediationFactoryRankedPathsEmptyState,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-empty-states";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";

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

describe("resolveRemediationFactoryPriorityQueueEmptyState", () => {
  it("prefers cloud collection when setup is incomplete", () => {
    const state = resolveRemediationFactoryPriorityQueueEmptyState(false);

    expect(state.actions?.[0]?.label).toBe("Open collection");
    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(state.actions?.[0]?.variant).toBe("primary");
    expect(state.actions?.[1]?.href).toBe(REVIEWS_NEW_PATH);
  });

  it("keeps start review primary when collection is complete", () => {
    expect(resolveRemediationFactoryPriorityQueueEmptyState(true)).toEqual(REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY);
  });
});
