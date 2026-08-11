import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasCloudPlatformScopeWorkspace,
  readCloudPlatformScopeFromStorage,
  resetCloudPlatformScopeSessionStateForTests,
  resolveLandingCloudPlatformScope,
  visibleCloudProviders,
  visibleLandingPlatformCards,
  writeCloudPlatformScopeToStorage,
} from "@/lib/cloud-platform-scope-storage";
import * as operatorScopeStorage from "@/lib/operator-scope-storage";

describe("cloud-platform-scope-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetCloudPlatformScopeSessionStateForTests();
    vi.restoreAllMocks();
  });

  it("defaults to all platforms visible", () => {
    const scope = readCloudPlatformScopeFromStorage();

    expect(scope["evidence-only"]).toBe(true);
    expect(scope.azure).toBe(true);
    expect(scope.aws).toBe(true);
    expect(scope.gcp).toBe(true);
  });

  it("orders provider cards neutrally with evidence-only first", () => {
    const cards = visibleLandingPlatformCards({
      "evidence-only": true,
      azure: true,
      aws: true,
      gcp: true,
    });

    expect(cards).toEqual(["evidence-only", "aws", "azure", "gcp"]);
  });

  it("hides deselected providers from landing cards", () => {
    const scope = {
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: false,
    } as const;

    expect(visibleCloudProviders(scope)).toEqual(["aws"]);
    expect(visibleLandingPlatformCards(scope)).toEqual(["evidence-only", "aws"]);
  });

  it("keeps toggles without operator workspace in session memory and notifies (TB-1139)", () => {
    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "",
      "x-workspace-id": "",
      "x-project-id": "",
    });

    const events: string[] = [];
    const onChanged = () => {
      events.push("changed");
    };

    window.addEventListener("archlucid:cloud-platform-scope-changed", onChanged);

    try {
      writeCloudPlatformScopeToStorage({
        "evidence-only": true,
        azure: true,
        aws: true,
        gcp: false,
      });

      expect(events).toEqual(["changed"]);
      expect(readCloudPlatformScopeFromStorage().gcp).toBe(false);
      expect(window.localStorage.length).toBe(0);
    } finally {
      window.removeEventListener("archlucid:cloud-platform-scope-changed", onChanged);
    }
  });

  it("flushes deferred scope into an empty workspace key and clears session memory", () => {
    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "",
      "x-workspace-id": "",
      "x-project-id": "",
    });

    writeCloudPlatformScopeToStorage({
      "evidence-only": true,
      azure: true,
      aws: true,
      gcp: false,
    });

    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot",
        projectLabel: "Default",
      }),
    );

    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "tenant-1",
      "x-workspace-id": "workspace-1",
      "x-project-id": "project-1",
    });

    expect(readCloudPlatformScopeFromStorage().gcp).toBe(false);
    expect(window.localStorage.getItem("archlucid.cloud-platform-scope.v1.workspace-1")).toContain('"gcp":false');

    window.localStorage.removeItem("archlucid_operator_scope_v1");
    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "",
      "x-workspace-id": "",
      "x-project-id": "",
    });
    expect(readCloudPlatformScopeFromStorage().gcp).toBe(true);
  });

  it("fail-closes landing scope to all platforms when effective scope has no workspace (TB-1142)", () => {
    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "",
      "x-workspace-id": "",
      "x-project-id": "",
    });

    writeCloudPlatformScopeToStorage({
      "evidence-only": true,
      azure: true,
      aws: true,
      gcp: false,
    });

    expect(hasCloudPlatformScopeWorkspace()).toBe(false);
    expect(readCloudPlatformScopeFromStorage().gcp).toBe(false);
    expect(resolveLandingCloudPlatformScope().gcp).toBe(true);
  });

  it("resolves landing scope from storage when workspace is present (TB-1142)", () => {
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot",
        projectLabel: "Default",
      }),
    );

    writeCloudPlatformScopeToStorage({
      "evidence-only": true,
      azure: false,
      aws: true,
      gcp: true,
    });

    expect(hasCloudPlatformScopeWorkspace()).toBe(true);
    expect(resolveLandingCloudPlatformScope().azure).toBe(false);
  });
});
