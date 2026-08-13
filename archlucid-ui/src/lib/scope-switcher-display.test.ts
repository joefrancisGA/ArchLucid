import { describe, expect, it } from "vitest";

import {
  BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
} from "@/lib/buyer/buyer-polish-copy";
import {
  countSelectableScopeOptions,
  formatScopeSwitcherSampleFullTitle,
  formatScopeSwitcherTriggerAccessibleLabel,
  formatScopeSwitcherTriggerLabel,
  isEffectiveDevDefaultScope,
  isScopeSwitcherOptionSelected,
  isScopeSwitchingAvailable,
  resolveScopeSwitcherOptionPrimaryLabel,
  workspaceShortNameFromLabel,
} from "@/lib/scope-switcher-display";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";

describe("scope-switcher-display", () => {
  it("detects the dev default sample workspace scope", () => {
    expect(isEffectiveDevDefaultScope(DEV_SCOPE_WORKSPACE_ID, DEV_SCOPE_PROJECT_ID)).toBe(true);
    expect(isEffectiveDevDefaultScope(DEV_SCOPE_WORKSPACE_ID, "other-project")).toBe(false);
  });

  it("formats compact and accessible sample workspace labels separately", () => {
    const args = {
      workspaceLabel: "Claims Intake Workspace",
      projectLabel: "Primary project",
      isSampleWorkspaceSession: true,
      includeProject: false,
    };

    expect(formatScopeSwitcherTriggerLabel(args)).toBe(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
    expect(formatScopeSwitcherSampleFullTitle()).toBe("Sample workspace: Claims Intake Modernization");
    expect(formatScopeSwitcherTriggerAccessibleLabel(args)).toBe(
      `Sample workspace: Claims Intake Modernization. ${BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT}`,
    );
  });

  it("formats connected trigger labels without sample metadata in the compact label", () => {
    expect(
      formatScopeSwitcherTriggerLabel({
        workspaceLabel: "Claims Intake Workspace",
        projectLabel: "Primary project",
        isSampleWorkspaceSession: false,
        includeProject: true,
      }),
    ).toBe("Workspace: Claims Intake — Primary project");

    expect(
      formatScopeSwitcherTriggerAccessibleLabel({
        workspaceLabel: "Claims Intake Workspace",
        projectLabel: "Primary project",
        isSampleWorkspaceSession: false,
        includeProject: true,
      }),
    ).toBe("Active workspace: Workspace: Claims Intake — Primary project");
  });

  it("derives short workspace names from display labels", () => {
    expect(workspaceShortNameFromLabel("Claims Intake Workspace")).toBe("Claims Intake");
    expect(workspaceShortNameFromLabel("")).toBe("Claims Intake");
  });

  it("treats switching as available only when more than one project option exists", () => {
    const single = [
      {
        workspaceId: "ws-1",
        name: "Claims Intake Workspace",
        projects: [{ projectId: "p-1", name: "Primary project" }],
      },
    ];
    const multiple = [
      {
        workspaceId: "ws-1",
        name: "Claims Intake Workspace",
        projects: [
          { projectId: "p-1", name: "Primary project" },
          { projectId: "p-2", name: "Secondary project" },
        ],
      },
    ];

    expect(countSelectableScopeOptions(single)).toBe(1);
    expect(isScopeSwitchingAvailable(single)).toBe(false);
    expect(countSelectableScopeOptions(multiple)).toBe(2);
    expect(isScopeSwitchingAvailable(multiple)).toBe(true);
  });

  it("leads single-project options with the workspace name and multi-project options with the project name", () => {
    expect(
      resolveScopeSwitcherOptionPrimaryLabel({
        workspaceName: "Product Tour — Architecture Review",
        projectName: "product-tour-architecture-context",
        workspaceProjectCount: 1,
      }),
    ).toBe("Product Tour — Architecture Review");

    expect(
      resolveScopeSwitcherOptionPrimaryLabel({
        workspaceName: "Claims Intake Workspace",
        projectName: "Secondary project",
        workspaceProjectCount: 2,
      }),
    ).toBe("Secondary project");
  });

  it("matches the active workspace and project for selected option state", () => {
    expect(
      isScopeSwitcherOptionSelected({
        optionWorkspaceId: "ws-1",
        optionProjectId: "p-1",
        activeWorkspaceId: "ws-1",
        activeProjectId: "p-1",
      }),
    ).toBe(true);

    expect(
      isScopeSwitcherOptionSelected({
        optionWorkspaceId: "ws-1",
        optionProjectId: "p-1",
        activeWorkspaceId: "ws-1",
        activeProjectId: "p-2",
      }),
    ).toBe(false);
  });
});
