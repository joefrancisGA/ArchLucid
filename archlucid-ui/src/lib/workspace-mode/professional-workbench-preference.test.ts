import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PROFESSIONAL_WORKBENCH_STORAGE_KEY,
  hasExplicitProfessionalWorkbenchTabOnlyInStorage,
  persistProfessionalWorkbenchEnabled,
  readProfessionalWorkbenchEnabledFromStorage,
  syncProfessionalWorkbenchFromServer,
  writeProfessionalWorkbenchEnabledToStorage,
} from "@/lib/workspace-mode/professional-workbench-preference";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode/workspace-mode-preference";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn(),
  setUserProfessionalWorkbenchEnabled: vi.fn(async () => undefined),
}));

import { getUserPreferences, setUserProfessionalWorkbenchEnabled } from "@/lib/api/user-preferences";

describe("professional-workbench-preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(getUserPreferences).mockReset();
    vi.mocked(setUserProfessionalWorkbenchEnabled).mockReset();
  });

  it("defaults workbench on for Working mode when storage is unset", () => {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");

    expect(readProfessionalWorkbenchEnabledFromStorage()).toBe(true);
    expect(hasExplicitProfessionalWorkbenchTabOnlyInStorage()).toBe(false);
  });

  it("defaults workbench off for Guided mode", () => {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "guided");

    expect(readProfessionalWorkbenchEnabledFromStorage()).toBe(false);
  });

  it("treats stored 0 as explicit Tab-only", () => {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    writeProfessionalWorkbenchEnabledToStorage(false);

    expect(readProfessionalWorkbenchEnabledFromStorage()).toBe(false);
    expect(hasExplicitProfessionalWorkbenchTabOnlyInStorage()).toBe(true);
  });

  it("syncs explicit server preference into storage", async () => {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    vi.mocked(getUserPreferences).mockResolvedValue({
      professionalWorkbenchEnabled: false,
      professionalWorkbenchEnabledIsExplicit: true,
    } as Awaited<ReturnType<typeof getUserPreferences>>);

    await expect(syncProfessionalWorkbenchFromServer()).resolves.toBe(false);
    expect(window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY)).toBe("0");
  });

  it("keeps local cache when server preference is not explicit", async () => {
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    writeProfessionalWorkbenchEnabledToStorage(false);
    vi.mocked(getUserPreferences).mockResolvedValue({
      professionalWorkbenchEnabled: true,
      professionalWorkbenchEnabledIsExplicit: false,
    } as Awaited<ReturnType<typeof getUserPreferences>>);

    await expect(syncProfessionalWorkbenchFromServer()).resolves.toBe(false);
    expect(window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY)).toBe("0");
  });

  it("writes preference through the user-preferences client", async () => {
    await persistProfessionalWorkbenchEnabled(true);

    expect(setUserProfessionalWorkbenchEnabled).toHaveBeenCalledWith(true);
    expect(window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY)).toBe("1");
  });
});
