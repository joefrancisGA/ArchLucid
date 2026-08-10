import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUserPreferencesMock, setUserAppearancePreferenceMock } = vi.hoisted(() => ({
  getUserPreferencesMock: vi.fn().mockRejectedValue(new Error("anonymous")),
  setUserAppearancePreferenceMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => getUserPreferencesMock(...args),
  setUserAppearancePreference: (...args: unknown[]) => setUserAppearancePreferenceMock(...args),
}));

describe("ThemePreferenceSelector", () => {
  let COLOR_MODE_STORAGE_KEY: typeof import("@/lib/color-mode-preference").COLOR_MODE_STORAGE_KEY;
  let ColorModePreferenceProvider: typeof import("@/components/ColorModePreferenceProvider").ColorModePreferenceProvider;
  let ThemePreferenceSelector: typeof import("./ThemePreferenceSelector").ThemePreferenceSelector;

  beforeEach(async () => {
    vi.resetModules();
    getUserPreferencesMock.mockReset();
    setUserAppearancePreferenceMock.mockReset();
    getUserPreferencesMock.mockRejectedValue(new Error("anonymous"));
    setUserAppearancePreferenceMock.mockResolvedValue(undefined);

    const colorMode = await import("@/lib/color-mode-preference");
    const provider = await import("@/components/ColorModePreferenceProvider");
    const selector = await import("./ThemePreferenceSelector");

    COLOR_MODE_STORAGE_KEY = colorMode.COLOR_MODE_STORAGE_KEY;
    ColorModePreferenceProvider = provider.ColorModePreferenceProvider;
    ThemePreferenceSelector = selector.ThemePreferenceSelector;

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  function renderThemeSelector() {
    return render(
      <ColorModePreferenceProvider>
        <ThemePreferenceSelector />
      </ColorModePreferenceProvider>,
    );
  }

  it("renders accessible radio-card theme options", async () => {
    renderThemeSelector();

    await waitFor(() => {
      expect(screen.getByTestId("theme-preference-option-system")).toBeInTheDocument();
    });

    expect(screen.getByTestId("theme-preference-option-light")).toBeInTheDocument();
    expect(screen.getByTestId("theme-preference-option-dark")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /System/i })).toBeInTheDocument();
  });

  it("persists dark selection locally and to the server", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderThemeSelector();

    const darkOption = await waitFor(() => document.getElementById("theme-preference-dark") as HTMLInputElement);

    fireEvent.click(darkOption);

    expect(setItem).toHaveBeenCalledWith(COLOR_MODE_STORAGE_KEY, "dark");
    expect(darkOption).toBeChecked();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await waitFor(() => {
      expect(setUserAppearancePreferenceMock).toHaveBeenCalledWith("dark");
    });
  });
});
