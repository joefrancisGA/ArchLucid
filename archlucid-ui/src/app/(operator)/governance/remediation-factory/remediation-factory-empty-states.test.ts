import { describe, expect, it } from "vitest";

import {
  REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
  REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT,
  REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT,
  resolveRemediationFactoryArchitectSnapshotsEmptyState,
  resolveRemediationFactoryPathInspectSelectPrompt,
  resolveRemediationFactoryPriorityQueueEmptyState,
  resolveRemediationFactoryRankedPathsEmptyState,
  resolveRemediationFactorySimulatorSelectPrompt,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-empty-states";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { SECURENOW_INVESTIGATION_EFFORT_PATH } from "@/lib/product-line/securenow-investigation-effort-copy";

describe("resolveRemediationFactoryRankedPathsEmptyState", () => {
  it("prefers cloud collection when setup is incomplete", () => {
    const state = resolveRemediationFactoryRankedPathsEmptyState(false);

    expect(state.actions?.[0]?.label).toBe("Open collection");
    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(state.actions?.[0]?.variant).toBe("primary");
    expect(state.actions?.[1]?.href).toBe(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH);
  });

  it("keeps upload inventory primary when collection is complete and adds synthetic ROI walkthrough", () => {
    const state = resolveRemediationFactoryRankedPathsEmptyState(true);

    expect(state.actions?.[0]).toEqual(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY.actions?.[0]);
    expect(state.actions?.[1]).toEqual(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY.actions?.[1]);
    expect(state.actions?.[2]?.href).toBe(SECURENOW_INVESTIGATION_EFFORT_PATH);
    expect(state.actions?.[2]?.label).toBe("Synthetic ROI walkthrough");
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

  it("keeps start review primary when collection is complete and adds synthetic ROI walkthrough", () => {
    const state = resolveRemediationFactoryPriorityQueueEmptyState(true);

    expect(state.actions?.[0]).toEqual(REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY.actions?.[0]);
    expect(state.actions?.[1]?.href).toBe(SECURENOW_INVESTIGATION_EFFORT_PATH);
  });
});

describe("resolveRemediationFactorySimulatorSelectPrompt", () => {
  it("adds Open collection when setup is incomplete", () => {
    const state = resolveRemediationFactorySimulatorSelectPrompt(false);

    expect(state.actions?.[0]?.label).toBe("Open collection");
    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
  });

  it("keeps the default prompt when collection is complete", () => {
    expect(resolveRemediationFactorySimulatorSelectPrompt(true)).toEqual(REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT);
  });
});

describe("resolveRemediationFactoryPathInspectSelectPrompt", () => {
  it("adds Open collection when setup is incomplete", () => {
    const state = resolveRemediationFactoryPathInspectSelectPrompt(false);

    expect(state.actions?.[0]?.label).toBe("Open collection");
    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
  });

  it("keeps the default prompt when collection is complete", () => {
    expect(resolveRemediationFactoryPathInspectSelectPrompt(true)).toEqual(
      REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT,
    );
  });
});

describe("resolveRemediationFactoryArchitectSnapshotsEmptyState", () => {
  it("adds Open collection when setup is incomplete", () => {
    const state = resolveRemediationFactoryArchitectSnapshotsEmptyState(false);

    expect(state.actions?.[0]?.href).toBe(CLOUD_CONNECTIONS_PATH);
  });
});
