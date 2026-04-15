import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorModeToggle } from "./ColorModeToggle";

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

  it("persists light preference and applies dark class removal", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<ColorModeToggle />);

    await waitFor(() => {
      expect(screen.getByRole("group", { name: /color mode/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Light$/i }));

    expect(setItem).toHaveBeenCalledWith("archlucid_color_mode", "light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists dark preference and applies dark class on html", async () => {
    render(<ColorModeToggle />);

    await waitFor(() => {
      expect(screen.getByRole("group", { name: /color mode/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Dark$/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
