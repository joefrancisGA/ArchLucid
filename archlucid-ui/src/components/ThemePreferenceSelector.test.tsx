import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorModePreferenceProvider } from "@/components/ColorModePreferenceProvider";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

import { ThemePreferenceSelector } from "./ThemePreferenceSelector";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn().mockRejectedValue(new Error("anonymous")),
  setUserAppearancePreference: vi.fn().mockResolvedValue(undefined),
}));

import { setUserAppearancePreference } from "@/lib/api/user-preferences";

function renderThemeSelector() {
  return render(
    <ColorModePreferenceProvider>
      <ThemePreferenceSelector />
    </ColorModePreferenceProvider>,
  );
}

describe("ThemePreferenceSelector", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

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
    expect(setUserAppearancePreference).toHaveBeenCalledWith("dark");
  });
});
