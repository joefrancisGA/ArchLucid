import { afterEach, describe, expect, it, vi } from "vitest";

import {
  COLOR_MODE_STORAGE_KEY,
  normalizeColorModePreference,
  persistColorModePreference,
  syncColorModePreferenceFromServer,
} from "@/lib/color-mode-preference";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn(),
  setUserAppearancePreference: vi.fn(),
}));

import { getUserPreferences, setUserAppearancePreference } from "@/lib/api/user-preferences";

describe("color-mode-preference", () => {
  afterEach(() => {
    vi.mocked(getUserPreferences).mockReset();
    vi.mocked(setUserAppearancePreference).mockReset();
    document.documentElement.classList.remove("dark");

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  it("normalizes invalid values to system", () => {
    expect(normalizeColorModePreference("sepia")).toBe("system");
    expect(normalizeColorModePreference(null)).toBe("system");
  });

  it("syncColorModePreferenceFromServer overwrites localStorage with server value", async () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    vi.mocked(getUserPreferences).mockResolvedValue({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
    });

    await syncColorModePreferenceFromServer();

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("migrates legacy browser-only preference when server has no explicit value", async () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    vi.mocked(getUserPreferences).mockResolvedValue({
      appearancePreference: "system",
      appearancePreferenceIsExplicit: false,
    });

    await syncColorModePreferenceFromServer();

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(setUserAppearancePreference).toHaveBeenCalledWith("dark");
  });

  it("persistColorModePreference writes localStorage and applies dark class", () => {
    persistColorModePreference("dark", false);

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
