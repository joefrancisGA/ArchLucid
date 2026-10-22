import { describe, expect, it } from "vitest";

import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  buildDemoSeededOverviewRunSummary,
  isDemoSeededOverviewInjectedRun,
  isDemoSeededOverviewScope,
  isDemoSeededOverviewWorkspaceLabel,
  isPinnedDemoProjectId,
  resolveDemoSeededOverviewSamplePackage,
  resolveOverviewListProjectId,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import {
  DEMO_WORKSPACE_A_RUN_ID,
  DEMO_WORKSPACE_B_RUN_ID,
  resolveDemoWorkspaceScopeHeadersForRunId,
} from "@/lib/demo-workspace-scope";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID, getScopeHeaders } from "@/lib/scope";
import { SHOWCASE_SAMPLE_REVIEW_REGISTRY } from "@/lib/showcase-sample-review-registry";

describe("demo-seeded-overview (TB-1039)", () => {
  it("detects pinned Workspace A/B project ids from the fixture manifest", () => {
    const workspaceA = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_A_RUN_ID);
    const workspaceB = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_B_RUN_ID);

    expect(workspaceA).not.toBeNull();
    expect(workspaceB).not.toBeNull();
    expect(isPinnedDemoProjectId(workspaceA!["x-project-id"])).toBe(true);
    expect(isPinnedDemoProjectId(workspaceB!["x-project-id"])).toBe(true);
    expect(isPinnedDemoProjectId("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("treats Claims Intake Demo labels and dev-default scope as demo-seeded", () => {
    expect(isDemoSeededOverviewWorkspaceLabel(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL)).toBe(true);
    expect(isDemoSeededOverviewWorkspaceLabel("Acme Corp Workspace")).toBe(false);
    expect(isDemoSeededOverviewScope(getScopeHeaders())).toBe(true);
    expect(
      isDemoSeededOverviewScope({
        "x-tenant-id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "x-workspace-id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "x-project-id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
      }),
    ).toBe(false);
  });

  it("lists runs under the pinned demo project id instead of default", () => {
    const workspaceA = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_A_RUN_ID)!;

    expect(resolveOverviewListProjectId(workspaceA, "default")).toBe(workspaceA["x-project-id"]);
    expect(resolveOverviewListProjectId(getScopeHeaders(), "default")).toBe("default");
  });

  it("resolves Workspace A/B sample packages by project or workspace id", () => {
    const workspaceA = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_A_RUN_ID)!;
    const workspaceB = resolveDemoWorkspaceScopeHeadersForRunId(DEMO_WORKSPACE_B_RUN_ID)!;

    expect(resolveDemoSeededOverviewSamplePackage(workspaceA).runId).toBe(DEMO_WORKSPACE_A_RUN_ID);
    expect(resolveDemoSeededOverviewSamplePackage(workspaceB).runId).toBe(DEMO_WORKSPACE_B_RUN_ID);
    expect(
      resolveDemoSeededOverviewSamplePackage({
        "x-tenant-id": workspaceB["x-tenant-id"],
        "x-workspace-id": workspaceB["x-workspace-id"],
        "x-project-id": "00000000-0000-0000-0000-000000000099",
      }).runId,
    ).toBe(DEMO_WORKSPACE_B_RUN_ID);
    expect(resolveDemoSeededOverviewSamplePackage(null).runId).toBe(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);
    expect(resolveDemoSeededOverviewSamplePackage(null).label).toBe(OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA);
  });

  it("injects a sample row only when the overview list is empty on demo-seeded scope", () => {
    expect(
      shouldInjectDemoSeededOverviewSample({
        itemCount: 0,
        scopeHeaders: {
          "x-tenant-id": "11111111-1111-1111-1111-111111111111",
          "x-workspace-id": DEV_SCOPE_WORKSPACE_ID,
          "x-project-id": DEV_SCOPE_PROJECT_ID,
        },
      }),
    ).toBe(true);

    expect(
      shouldInjectDemoSeededOverviewSample({
        itemCount: 1,
        scopeHeaders: getScopeHeaders(),
      }),
    ).toBe(false);

    const row = buildDemoSeededOverviewRunSummary("default", null);
    expect(row.runId).toBe(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);
    expect(row.hasGoldenManifest).toBe(true);
    expect(row.hasGovernanceWarnings).toBe(true);
    expect(isDemoSeededOverviewInjectedRun(row)).toBe(true);
  });
});
