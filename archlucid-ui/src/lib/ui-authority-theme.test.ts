import { describe, expect, it } from "vitest";

import {
  buildAuthorityThemeToggleLabel,
  isUiAuthorityTheme,
  resolveAuthorityThemeFromEnv,
  resolveEffectiveAuthorityTheme,
  resolveNextAuthorityTheme,
} from "./ui-authority-theme";

describe("ui-authority-theme", () => {
  it("recognizes theme ids", () => {
    expect(isUiAuthorityTheme("default")).toBe(true);
    expect(isUiAuthorityTheme("charcoal")).toBe(true);
    expect(isUiAuthorityTheme("teal")).toBe(false);
  });

  it("maps env aliases to charcoal", () => {
    expect(resolveAuthorityThemeFromEnv("charcoal")).toBe("charcoal");
    expect(resolveAuthorityThemeFromEnv("authority")).toBe("charcoal");
    expect(resolveAuthorityThemeFromEnv("charcoal-authority")).toBe("charcoal");
    expect(resolveAuthorityThemeFromEnv(undefined)).toBe("default");
    expect(resolveAuthorityThemeFromEnv("default")).toBe("default");
  });

  it("prefers stored theme over env default", () => {
    expect(resolveEffectiveAuthorityTheme("default", "charcoal")).toBe("default");
    expect(resolveEffectiveAuthorityTheme(null, "charcoal")).toBe("charcoal");
  });

  it("cycles themes for evaluation toggle", () => {
    expect(resolveNextAuthorityTheme("default")).toBe("charcoal");
    expect(resolveNextAuthorityTheme("charcoal")).toBe("default");
    expect(buildAuthorityThemeToggleLabel("charcoal")).toContain("Charcoal authority");
  });
});
