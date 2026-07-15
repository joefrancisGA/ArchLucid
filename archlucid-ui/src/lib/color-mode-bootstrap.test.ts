import { describe, expect, it } from "vitest";

import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";
import { buildColorModeBootstrapInlineScript } from "@/lib/color-mode-bootstrap";
import { resolveAuthorityThemeFromEnv } from "@/lib/ui-authority-theme";

function runBootstrapScript(script: string, options?: { readonly storedMode?: string | null; readonly prefersDark?: boolean }): void {
  const storedMode = options?.storedMode;
  const prefersDark = options?.prefersDark ?? false;

  window.localStorage.clear();
  document.documentElement.classList.remove("dark");

  if (storedMode !== undefined && storedMode !== null) {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, storedMode);
  }

  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-color-scheme") && prefersDark,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
    addListener: () => undefined,
    removeListener: () => undefined,
  })) as typeof window.matchMedia;

  new Function(script)();
}

describe("buildColorModeBootstrapInlineScript", () => {
  it("defaults first-time users to system and resolves dark from prefers-color-scheme", () => {
    const script = buildColorModeBootstrapInlineScript("default");

    runBootstrapScript(script, { prefersDark: true });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not hard-code light when system preference is dark", () => {
    const script = buildColorModeBootstrapInlineScript("default");

    runBootstrapScript(script, { storedMode: "system", prefersDark: true });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("forces light when the stored preference is light", () => {
    const script = buildColorModeBootstrapInlineScript("default");

    runBootstrapScript(script, { storedMode: "light", prefersDark: true });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("normalizes legacy stored values to system resolution", () => {
    const script = buildColorModeBootstrapInlineScript("default");

    runBootstrapScript(script, { storedMode: "charcoal", prefersDark: true });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("rejects unknown authority theme env defaults", () => {
    const script = buildColorModeBootstrapInlineScript(resolveAuthorityThemeFromEnv("not-a-theme"));

    runBootstrapScript(script);

    expect(document.documentElement.getAttribute("data-al-authority-theme")).toBe("default");
  });
});
