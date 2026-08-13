import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUserPreferencesMock, setUserAppearancePreferenceMock } = vi.hoisted(() => ({
  getUserPreferencesMock: vi.fn(),
  setUserAppearancePreferenceMock: vi.fn(),
}));

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => getUserPreferencesMock(...args),
  setUserAppearancePreference: (...args: unknown[]) => setUserAppearancePreferenceMock(...args),
}));

type MatchMediaController = {
  readonly matches: boolean;
  readonly setMatches: (matches: boolean) => void;
  readonly dispose: () => void;
};

function installMatchMedia(initialMatches: boolean): MatchMediaController {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes("prefers-color-scheme") ? matches : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    addListener: () => undefined,
    removeListener: () => undefined,
  })) as typeof window.matchMedia;

  return {
    get matches() {
      return matches;
    },
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;

      listeners.forEach((listener) => listener(event));
    },
    dispose() {
      listeners.clear();
    },
  };
}

describe("color-mode-preference", () => {
  let matchMediaController: MatchMediaController | null = null;
  let COLOR_MODE_STORAGE_KEY: typeof import("@/lib/color-mode-preference").COLOR_MODE_STORAGE_KEY;
  let applyColorModePreference: typeof import("@/lib/color-mode-preference").applyColorModePreference;
  let normalizeColorModePreference: typeof import("@/lib/color-mode-preference").normalizeColorModePreference;
  let persistColorModePreference: typeof import("@/lib/color-mode-preference").persistColorModePreference;
  let resolveColorModeAppearance: typeof import("@/lib/color-mode-preference").resolveColorModeAppearance;
  let resolveDarkAppearance: typeof import("@/lib/color-mode-preference").resolveDarkAppearance;
  let syncColorModePreferenceFromServer: typeof import("@/lib/color-mode-preference").syncColorModePreferenceFromServer;
  let persistColorModePreferenceToServer: typeof import("@/lib/color-mode-preference").persistColorModePreferenceToServer;

  beforeEach(async () => {
    vi.resetModules();
    getUserPreferencesMock.mockReset();
    setUserAppearancePreferenceMock.mockReset();

    const mod = await import("@/lib/color-mode-preference");

    COLOR_MODE_STORAGE_KEY = mod.COLOR_MODE_STORAGE_KEY;
    applyColorModePreference = mod.applyColorModePreference;
    normalizeColorModePreference = mod.normalizeColorModePreference;
    persistColorModePreference = mod.persistColorModePreference;
    resolveColorModeAppearance = mod.resolveColorModeAppearance;
    resolveDarkAppearance = mod.resolveDarkAppearance;
    syncColorModePreferenceFromServer = mod.syncColorModePreferenceFromServer;
    persistColorModePreferenceToServer = mod.persistColorModePreferenceToServer;

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  afterEach(() => {
    getUserPreferencesMock.mockReset();
    setUserAppearancePreferenceMock.mockReset();
    document.documentElement.classList.remove("dark");
    matchMediaController?.dispose();
    matchMediaController = null;

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  it("normalizes invalid and legacy values to system without mapping system to light", () => {
    expect(normalizeColorModePreference("sepia")).toBe("system");
    expect(normalizeColorModePreference(null)).toBe("system");
    expect(normalizeColorModePreference("charcoal")).toBe("system");
    expect(normalizeColorModePreference("LIGHT")).toBe("light");
    expect(normalizeColorModePreference("Dark")).toBe("dark");
    expect(normalizeColorModePreference("SYSTEM")).toBe("system");
  });

  it("resolves system to dark when the device prefers dark", () => {
    expect(resolveDarkAppearance("system", true)).toBe(true);
    expect(resolveColorModeAppearance("system", true)).toBe("dark");
  });

  it("resolves system to light when the device prefers light", () => {
    expect(resolveDarkAppearance("system", false)).toBe(false);
    expect(resolveColorModeAppearance("system", false)).toBe("light");
  });

  it("keeps explicit light and dark independent of the operating system", () => {
    expect(resolveDarkAppearance("light", true)).toBe(false);
    expect(resolveDarkAppearance("dark", false)).toBe(true);
  });

  it("persists the user preference, not the resolved appearance", () => {
    persistColorModePreference("system", true);

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("syncColorModePreferenceFromServer overwrites localStorage with explicit server value", async () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    getUserPreferencesMock.mockResolvedValue({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
    });

    const synced = await syncColorModePreferenceFromServer();

    expect(synced).toBe("dark");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("migrates legacy browser-only preference when server has no explicit value", async () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    getUserPreferencesMock.mockResolvedValue({
      appearancePreference: "system",
      appearancePreferenceIsExplicit: false,
    });
    setUserAppearancePreferenceMock.mockResolvedValue(undefined);

    const synced = await syncColorModePreferenceFromServer();

    expect(synced).toBe("dark");
    expect(setUserAppearancePreferenceMock).toHaveBeenCalledWith("dark");
  });

  it("preserves explicit dark preference during server sync", async () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "system");
    getUserPreferencesMock.mockResolvedValue({
      appearancePreference: "dark",
      appearancePreferenceIsExplicit: true,
    });

    const synced = await syncColorModePreferenceFromServer();

    expect(synced).toBe("dark");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
  });

  it("applyColorModePreference follows system changes at runtime", () => {
    matchMediaController = installMatchMedia(true);

    applyColorModePreference("system", matchMediaController.matches);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    matchMediaController.setMatches(false);
    applyColorModePreference("system", false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persistColorModePreferenceToServer returns false when the API write fails", async () => {
    setUserAppearancePreferenceMock.mockRejectedValueOnce(new Error("offline"));

    await expect(persistColorModePreferenceToServer("dark")).resolves.toBe(false);
  });

  it("persistColorModePreferenceToServer returns true when the API write succeeds", async () => {
    setUserAppearancePreferenceMock.mockResolvedValueOnce(undefined);

    await expect(persistColorModePreferenceToServer("light")).resolves.toBe(true);
  });
});
