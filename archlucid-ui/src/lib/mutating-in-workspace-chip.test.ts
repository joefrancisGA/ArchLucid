import { beforeEach, describe, expect, it } from "vitest";

import {
  MUTATING_IN_WORKSPACE_CHIP_PREFIX,
  buildMutatingInWorkspaceChipCopy,
  formatMutatingInWorkspaceChipLabel,
  readMutatingInWorkspaceChipCopy,
  resolveMutatingInWorkspaceChipFromRecord,
} from "@/lib/mutating-in-workspace-chip";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator-scope-storage";

describe("mutating-in-workspace-chip (TB-2220)", () => {
  beforeEach(() => {
    clearOperatorScopeStorage();
  });

  it("formats prefix and workspace label", () => {
    expect(formatMutatingInWorkspaceChipLabel("Claims Intake")).toBe(
      `${MUTATING_IN_WORKSPACE_CHIP_PREFIX}: Claims Intake`,
    );
  });

  it("builds copy with stable prefix", () => {
    const copy = buildMutatingInWorkspaceChipCopy("Payments");
    expect(copy.prefix).toBe(MUTATING_IN_WORKSPACE_CHIP_PREFIX);
    expect(copy.workspaceScopeLabel).toBe("Payments");
    expect(copy.label).toBe(`${MUTATING_IN_WORKSPACE_CHIP_PREFIX}: Payments`);
  });

  it("resolves from a null record using the default workspace short name", () => {
    const copy = resolveMutatingInWorkspaceChipFromRecord(null);
    expect(copy.workspaceScopeLabel.length).toBeGreaterThan(0);
    expect(copy.label).toContain(MUTATING_IN_WORKSPACE_CHIP_PREFIX);
  });

  it("reads the active workspace label from storage after write", () => {
    writeOperatorScopeToStorage({
      tenantId: "t1",
      workspaceId: "w1",
      projectId: "p1",
      workspaceLabel: "Northwind Workspace",
      projectLabel: "Core",
    });

    const copy = readMutatingInWorkspaceChipCopy();
    expect(copy.workspaceScopeLabel).toBe("Northwind");
    expect(copy.label).toBe(`${MUTATING_IN_WORKSPACE_CHIP_PREFIX}: Northwind`);
  });
});
