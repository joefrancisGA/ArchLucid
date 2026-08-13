import { afterEach, describe, expect, it } from "vitest";

import {
  GOVERNANCE_MODE_STORAGE_KEY,
  readGovernanceModeEnabledFromStorage,
  writeGovernanceModeEnabledToStorage,
} from "@/lib/governance/governance-mode-storage";

describe("governance-mode-storage", () => {
  afterEach(() => {
    window.localStorage.removeItem(GOVERNANCE_MODE_STORAGE_KEY);
  });

  it("defaults to false when unset", () => {
    expect(readGovernanceModeEnabledFromStorage()).toBe(false);
  });

  it("persists enabled preference", () => {
    writeGovernanceModeEnabledToStorage(true);

    expect(window.localStorage.getItem(GOVERNANCE_MODE_STORAGE_KEY)).toBe("1");
    expect(readGovernanceModeEnabledFromStorage()).toBe(true);
  });
});
