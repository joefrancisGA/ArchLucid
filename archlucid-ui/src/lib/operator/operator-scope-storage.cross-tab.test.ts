import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  OPERATOR_SCOPE_STORAGE_KEY,
  readOperatorScopeFromStorage,
  refreshOperatorScopeFromCrossTabStorage,
  subscribeOperatorScopeStorageChanges,
  writeOperatorScopeToStorage,
} from "./operator-scope-storage";

describe("operator-scope-storage cross-tab (LW-085 / LW-088)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("notifies subscribers when another tab writes scope storage", () => {
    const listener = vi.fn();

    subscribeOperatorScopeStorageChanges(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: OPERATOR_SCOPE_STORAGE_KEY,
        newValue: JSON.stringify({
          tenantId: "tenant-a",
          workspaceId: "workspace-b",
          projectId: "project-b",
          workspaceLabel: "B",
          projectLabel: "Secondary",
        }),
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("refreshes dependent client state from cross-tab storage without rewriting storage", () => {
    const events: string[] = [];

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, () => {
      events.push("changed");
    });

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "A",
      projectLabel: "Primary",
    });

    refreshOperatorScopeFromCrossTabStorage();

    expect(events).toContain("changed");
    expect(readOperatorScopeFromStorage()?.workspaceId).toBe("workspace-a");
  });
});
