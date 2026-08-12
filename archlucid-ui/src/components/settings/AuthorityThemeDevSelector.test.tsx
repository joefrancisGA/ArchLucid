import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTHORITY_THEME_OPTION_SELECTED_CLASS,
  AuthorityThemeDevSelector,
} from "./AuthorityThemeDevSelector";
import { AUTHORITY_THEME_STORAGE_KEY } from "@/lib/ui-authority-theme";

describe("AuthorityThemeDevSelector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.setAttribute("data-al-authority-theme", "default");

    try {
      window.localStorage.removeItem(AUTHORITY_THEME_STORAGE_KEY);
    } catch {
      // ignore
    }
  });

  it("persists charcoal selection from settings with radio semantics", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<AuthorityThemeDevSelector />);

    const charcoalOption = await waitFor(() =>
      screen.getByTestId("authority-theme-option-charcoal"),
    );

    fireEvent.click(charcoalOption);

    expect(setItem).toHaveBeenCalledWith(AUTHORITY_THEME_STORAGE_KEY, "charcoal");
    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("charcoal");
    expect(charcoalOption).toHaveAttribute("role", "radio");
    expect(charcoalOption).toHaveAttribute("aria-checked", "true");
    expect(charcoalOption.className).toContain(AUTHORITY_THEME_OPTION_SELECTED_CLASS);
    expect(screen.getByTestId("authority-theme-override-status")).toHaveTextContent("Local override");
  });

  it("clears override and restores build default on reset", async () => {
    window.localStorage.setItem(AUTHORITY_THEME_STORAGE_KEY, "charcoal");

    render(<AuthorityThemeDevSelector />);

    const charcoalOption = await waitFor(() =>
      screen.getByTestId("authority-theme-option-charcoal"),
    );

    expect(charcoalOption).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByTestId("authority-theme-reset"));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTHORITY_THEME_STORAGE_KEY)).toBeNull();
    });
    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("default");
    expect(screen.getByTestId("authority-theme-override-status")).toHaveTextContent("Build default");
    expect(screen.getByTestId("authority-theme-reset")).toBeDisabled();
  });
});
