import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY,
  isLocalDevRecordStartupEnabled,
  readLocalDevPracticeSessionDoor,
  resolveLocalDevRecordStartupDoor,
  shouldBypassSampleWorkspaceRecordPin,
  writeLocalDevPracticeSessionDoor,
} from "@/lib/governance/local-dev-record-startup";

const devOverridesMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/lib/dev-testing-overrides", () => ({
  isDevTestingOverridesEnabled: () => devOverridesMock.enabled,
}));

describe("local-dev-record-startup", () => {
  beforeEach(() => {
    devOverridesMock.enabled = true;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    devOverridesMock.enabled = true;
    window.sessionStorage.clear();
  });

  it("is enabled only when dev testing overrides are enabled", () => {
    expect(isLocalDevRecordStartupEnabled()).toBe(true);
    expect(shouldBypassSampleWorkspaceRecordPin()).toBe(true);

    devOverridesMock.enabled = false;

    expect(isLocalDevRecordStartupEnabled()).toBe(false);
    expect(shouldBypassSampleWorkspaceRecordPin()).toBe(false);
  });

  it("defaults to Record when no session pick exists", () => {
    expect(resolveLocalDevRecordStartupDoor()).toBe("career");
    expect(readLocalDevPracticeSessionDoor()).toBeNull();
  });

  it("keeps Practice for the tab session until Record is selected again", () => {
    writeLocalDevPracticeSessionDoor("rehearsal");

    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBe("rehearsal");
    expect(resolveLocalDevRecordStartupDoor()).toBe("rehearsal");
    expect(readLocalDevPracticeSessionDoor()).toBe("rehearsal");

    writeLocalDevPracticeSessionDoor("career");

    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(resolveLocalDevRecordStartupDoor()).toBe("career");
  });

  it("does not read or write session storage when local dev startup is disabled", () => {
    devOverridesMock.enabled = false;
    writeLocalDevPracticeSessionDoor("rehearsal");

    expect(window.sessionStorage.getItem(LOCAL_DEV_PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(readLocalDevPracticeSessionDoor()).toBeNull();
    expect(resolveLocalDevRecordStartupDoor()).toBe("career");
  });
});
