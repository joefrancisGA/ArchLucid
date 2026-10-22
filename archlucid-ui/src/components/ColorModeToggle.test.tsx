import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorModePreferenceProvider } from "@/components/ColorModePreferenceProvider";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn().mockRejectedValue(new Error("offline")),
  setUserAppearancePreference: vi.fn().mockResolvedValue(undefined),
  invalidateUserPreferencesCache: vi.fn(),
}));

import {
  ColorModeToggle,
  buildColorModeToggleLabel,
  resolveNextColorModePreference,
} from "./ColorModeToggle";

function renderColorModeToggle() {
  return render(
    <ColorModePreferenceProvider>
      <ColorModeToggle />
    </ColorModePreferenceProvider>,
  );
}

describe("ColorModeToggle helpers", () => {
  it("advances system on a light OS to dark, not redundant light", () => {
    expect(resolveNextColorModePreference("system", false)).toBe("dark");
    expect(buildColorModeToggleLabel("system", false)).toBe(
      "Color mode: system (light). Activate to switch to dark.",
    );
  });

  it("advances system on a dark OS to light", () => {
    expect(resolveNextColorModePreference("system", true)).toBe("light");
    expect(buildColorModeToggleLabel("system", true)).toBe(
      "Color mode: system (dark). Activate to switch to light.",
    );
  });
});

describe("ColorModeToggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.removeItem("archlucid_color_mode");
    }
    catch {
      // ignore
    }
  });

  it("persists dark preference when system is showing light", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderColorModeToggle();

    const themeButton = await waitFor(() =>
      screen.getByRole("button", {
        name: /color mode: system \(light\)\. activate to switch to dark\./i,
      }),
    );

    fireEvent.click(themeButton);

    expect(setItem).toHaveBeenCalledWith("archlucid_color_mode", "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("cycles light to dark and dark back to system", async () => {
    window.localStorage.setItem("archlucid_color_mode", "light");

    renderColorModeToggle();

    const fromLight = await waitFor(() =>
      screen.getByRole("button", { name: /color mode: light\. activate to switch to dark\./i }),
    );

    fireEvent.click(fromLight);

    await waitFor(() => {
      expect(window.localStorage.getItem("archlucid_color_mode")).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    fireEvent.click(
      screen.getByRole("button", { name: /color mode: dark\. activate to match system \(light\)\./i }),
    );

    await waitFor(() => {
      expect(window.localStorage.getItem("archlucid_color_mode")).toBe("system");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });
});
