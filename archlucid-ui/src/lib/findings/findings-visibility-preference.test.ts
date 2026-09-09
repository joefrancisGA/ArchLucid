import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  DEFAULT_FINDINGS_VISIBILITY_PREFERENCES,
  readFindingsVisibilityFromStorage,
  resetFindingsVisibilitySessionStateForTests,
  resolveDefaultShowLowConfidenceEnabled,
  resolveFindingsVisibilityDefaults,
  resolveFindingsVisibilityFlag,
  writeFindingsVisibilityToStorage,
} from "@/lib/findings/findings-visibility-preference";

describe("findings-visibility-preference", () => {
  beforeEach(() => {
    resetFindingsVisibilitySessionStateForTests();
  });

  it("defaults visibility toggles to off except Working show-low-confidence", () => {
    expect(readFindingsVisibilityFromStorage("guided")).toEqual(DEFAULT_FINDINGS_VISIBILITY_PREFERENCES);
    expect(readFindingsVisibilityFromStorage("working")).toEqual(
      resolveFindingsVisibilityDefaults("working"),
    );
    expect(resolveDefaultShowLowConfidenceEnabled("working")).toBe(true);
    expect(resolveDefaultShowLowConfidenceEnabled("guided")).toBe(false);
  });

  it("persists visibility toggles to localStorage", () => {
    writeFindingsVisibilityToStorage({
      hideGenericEnabled: true,
      showLowConfidenceEnabled: true,
      showAdvisoryEnabled: false,
    });

    expect(readFindingsVisibilityFromStorage()).toEqual({
      hideGenericEnabled: true,
      showLowConfidenceEnabled: true,
      showAdvisoryEnabled: false,
    });
  });

  it("prefers URL overrides over account defaults", () => {
    writeFindingsVisibilityToStorage({
      hideGenericEnabled: true,
      showLowConfidenceEnabled: false,
      showAdvisoryEnabled: false,
    });

    expect(resolveFindingsVisibilityFlag(true, false, true)).toBe(false);
    expect(resolveFindingsVisibilityFlag(false, false, true)).toBe(true);
  });

  it("syncs explicit server prefs into storage", async () => {
    vi.doMock("@/lib/api/user-preferences", () => ({
      getUserPreferences: vi.fn(async () => ({
        findingsHideGenericEnabled: true,
        findingsHideGenericEnabledIsExplicit: true,
        findingsShowLowConfidenceEnabled: false,
        findingsShowLowConfidenceEnabledIsExplicit: false,
        findingsShowAdvisoryEnabled: true,
        findingsShowAdvisoryEnabledIsExplicit: true,
        workspaceMode: "guided",
      })),
    }));

    const { syncFindingsVisibilityFromServer } = await import("@/lib/findings/findings-visibility-preference");
    const synced = await syncFindingsVisibilityFromServer();

    expect(synced).toEqual({
      hideGenericEnabled: true,
      showLowConfidenceEnabled: false,
      showAdvisoryEnabled: true,
    });
    expect(readFindingsVisibilityFromStorage("guided")).toEqual(synced);
  });

  it("applies Working default show-low-confidence when server pref is not explicit", async () => {
    vi.doMock("@/lib/api/user-preferences", () => ({
      getUserPreferences: vi.fn(async () => ({
        findingsHideGenericEnabled: false,
        findingsHideGenericEnabledIsExplicit: false,
        findingsShowLowConfidenceEnabled: false,
        findingsShowLowConfidenceEnabledIsExplicit: false,
        findingsShowAdvisoryEnabled: false,
        findingsShowAdvisoryEnabledIsExplicit: false,
        workspaceMode: "working",
      })),
    }));

    const { findingsVisibilityFromUserPreferencesResponse } = await import(
      "@/lib/findings/findings-visibility-preference"
    );

    expect(
      findingsVisibilityFromUserPreferencesResponse({
        findingsHideGenericEnabled: false,
        findingsHideGenericEnabledIsExplicit: false,
        findingsShowLowConfidenceEnabled: false,
        findingsShowLowConfidenceEnabledIsExplicit: false,
        findingsShowAdvisoryEnabled: false,
        findingsShowAdvisoryEnabledIsExplicit: false,
        workspaceMode: "working",
      }).showLowConfidenceEnabled,
    ).toBe(true);
  });

  it("URL showLow=0 still hides low-confidence rows on Working", () => {
    writeFindingsVisibilityToStorage({
      hideGenericEnabled: false,
      showLowConfidenceEnabled: true,
      showAdvisoryEnabled: false,
    });

    expect(resolveFindingsVisibilityFlag(true, false, true)).toBe(false);
  });
});
