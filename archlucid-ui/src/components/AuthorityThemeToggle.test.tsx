import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthorityThemeToggle } from "./AuthorityThemeToggle";

describe("AuthorityThemeToggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.setAttribute("data-al-authority-theme", "default");

    try {
      window.localStorage.removeItem("archlucid_authority_theme");
    }
    catch {
      // ignore
    }
  });

  it("persists charcoal theme selection", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<AuthorityThemeToggle />);

    const button = await waitFor(() => screen.getByTestId("authority-theme-toggle"));

    fireEvent.click(button);

    expect(setItem).toHaveBeenCalledWith("archlucid_authority_theme", "charcoal");
    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("charcoal");
  });
});
