import { afterEach, describe, expect, it } from "vitest";

import {
  AUTHORITY_THEME_STORAGE_KEY,
  clearStoredAuthorityTheme,
  hasStoredAuthorityThemeOverride,
  persistAuthorityTheme,
} from "@/lib/ui-authority-theme";

describe("ui-authority-theme", () => {
  afterEach(() => {
    window.localStorage.removeItem(AUTHORITY_THEME_STORAGE_KEY);
    document.documentElement.setAttribute("data-al-authority-theme", "default");
  });

  it("reports override state and clears stored theme back to env default", () => {
    expect(hasStoredAuthorityThemeOverride()).toBe(false);

    persistAuthorityTheme("charcoal");

    expect(hasStoredAuthorityThemeOverride()).toBe(true);
    expect(window.localStorage.getItem(AUTHORITY_THEME_STORAGE_KEY)).toBe("charcoal");

    clearStoredAuthorityTheme("default");

    expect(hasStoredAuthorityThemeOverride()).toBe(false);
    expect(window.localStorage.getItem(AUTHORITY_THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("default");
  });
});
