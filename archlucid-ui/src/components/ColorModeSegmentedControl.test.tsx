import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

import { ColorModeSegmentedControl } from "./ColorModeSegmentedControl";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn(),
  setUserAppearancePreference: vi.fn(),
}));

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

  it("renders system, light, and dark options with helper text", async () => {
    render(<ColorModeSegmentedControl />);

    await waitFor(() => {
      expect(screen.getByTestId("color-mode-option-system")).toBeInTheDocument();
    });

    expect(screen.getByTestId("color-mode-option-light")).toBeInTheDocument();
    expect(screen.getByTestId("color-mode-option-dark")).toBeInTheDocument();
    expect(screen.getByText("System follows your device setting.")).toBeInTheDocument();
  });

  it("persists dark selection", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<ColorModeSegmentedControl />);

    const darkOption = await waitFor(() => screen.getByTestId("color-mode-option-dark"));

    fireEvent.click(darkOption);

    expect(setItem).toHaveBeenCalledWith(COLOR_MODE_STORAGE_KEY, "dark");
    expect(darkOption).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
