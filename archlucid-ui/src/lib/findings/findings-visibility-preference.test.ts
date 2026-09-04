import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  DEFAULT_FINDINGS_VISIBILITY_PREFERENCES,
  readFindingsVisibilityFromStorage,
  resetFindingsVisibilitySessionStateForTests,
  resolveFindingsVisibilityFlag,
  writeFindingsVisibilityToStorage,
} from "@/lib/findings/findings-visibility-preference";

describe("findings-visibility-preference", () => {
  beforeEach(() => {
    resetFindingsVisibilitySessionStateForTests();
  });

  it("defaults visibility toggles to off", () => {
    expect(readFindingsVisibilityFromStorage()).toEqual(DEFAULT_FINDINGS_VISIBILITY_PREFERENCES);
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
      })),
    }));

    const { syncFindingsVisibilityFromServer } = await import("@/lib/findings/findings-visibility-preference");
    const synced = await syncFindingsVisibilityFromServer();

    expect(synced).toEqual({
      hideGenericEnabled: true,
      showLowConfidenceEnabled: false,
      showAdvisoryEnabled: true,
    });
    expect(readFindingsVisibilityFromStorage()).toEqual(synced);
  });
});
