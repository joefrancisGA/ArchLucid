import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthorityThemeDevSelector } from "./AuthorityThemeDevSelector";

describe("AuthorityThemeDevSelector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.setAttribute("data-al-authority-theme", "default");

    try {
      window.localStorage.removeItem("archlucid_authority_theme");
    } catch {
      // ignore
    }
  });

  it("persists charcoal selection from settings", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<AuthorityThemeDevSelector />);

    const charcoalOption = await waitFor(() =>
      screen.getByTestId("authority-theme-option-charcoal"),
    );

    fireEvent.click(charcoalOption);

    expect(setItem).toHaveBeenCalledWith("archlucid_authority_theme", "charcoal");
    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("charcoal");
    expect(charcoalOption).toHaveAttribute("aria-pressed", "true");
  });
});
