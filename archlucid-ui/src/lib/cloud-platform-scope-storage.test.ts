import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readCloudPlatformScopeFromStorage,
  resetCloudPlatformScopeSessionStateForTests,
  resolveLandingCloudPlatformScope,
  visibleCloudProviders,
  visibleLandingPlatformCards,
  writeCloudPlatformScopeToStorage,
} from "@/lib/cloud-platform-scope-storage";

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

  it("persists personal scope and notifies subscribers", () => {
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
      expect(window.localStorage.getItem("archlucid.cloud-platform-scope.v1.personal")).toContain('"gcp":false');
      expect(resolveLandingCloudPlatformScope().gcp).toBe(false);
    } finally {
      window.removeEventListener("archlucid:cloud-platform-scope-changed", onChanged);
    }
  });
});
