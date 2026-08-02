import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorModePreferenceProvider } from "@/components/ColorModePreferenceProvider";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

import { ColorModeSegmentedControl } from "./ColorModeSegmentedControl";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn().mockRejectedValue(new Error("anonymous")),
  setUserAppearancePreference: vi.fn(),
  invalidateUserPreferencesCache: vi.fn(),
}));

function renderSegmentedControl() {
  return render(
    <ColorModePreferenceProvider>
      <ColorModeSegmentedControl />
    </ColorModePreferenceProvider>,
  );
}

describe("ColorModeSegmentedControl", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  it("renders theme preference options", async () => {
    renderSegmentedControl();

    await waitFor(() => {
      expect(screen.getByTestId("theme-preference-option-system")).toBeInTheDocument();
    });

    expect(screen.getByTestId("theme-preference-option-light")).toBeInTheDocument();
    expect(screen.getByTestId("theme-preference-option-dark")).toBeInTheDocument();
  });

  it("persists dark selection", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderSegmentedControl();

    const darkOption = await waitFor(() => document.getElementById("theme-preference-dark") as HTMLInputElement);

    fireEvent.click(darkOption);

    expect(setItem).toHaveBeenCalledWith(COLOR_MODE_STORAGE_KEY, "dark");
    expect(darkOption).toBeChecked();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
