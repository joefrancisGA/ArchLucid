import { describe, expect, it } from "vitest";

import {
  countSelectableScopeOptions,
  formatScopeSwitcherTriggerLabel,
  isScopeSwitchingAvailable,
  workspaceShortNameFromLabel,
} from "@/lib/scope-switcher-display";

describe("scope-switcher-display", () => {
  it("formats sample and connected trigger labels without W:/P: shorthand", () => {
    expect(
      formatScopeSwitcherTriggerLabel({
        workspaceLabel: "Claims Intake Workspace",
        projectLabel: "Primary project",
        isSampleWorkspaceSession: true,
        includeProject: false,
      }),
    ).toBe("Sample workspace: Claims Intake");

    expect(
      formatScopeSwitcherTriggerLabel({
        workspaceLabel: "Claims Intake Workspace",
        projectLabel: "Primary project",
        isSampleWorkspaceSession: false,
        includeProject: true,
      }),
    ).toBe("Workspace: Claims Intake — Primary project");
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
});
