import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  applyTenantBrandCssVars,
  BRAND_CSS_VAR_NAMES,
  clearTenantBrandCssVars,
  PRODUCT_BRAND_CSS_DEFAULTS,
} from "@/lib/design-tokens-brand";

describe("design-tokens-brand", () => {
  beforeEach(() => {
    clearTenantBrandCssVars();
  });

  afterEach(() => {
    clearTenantBrandCssVars();
  });

  it("applyTenantBrandCssVars sets css variables on document root", () => {
    applyTenantBrandCssVars({
      primary: "#112233",
      foreground: "#ffffff",
      background: "#000000",
    });

    expect(document.documentElement.style.getPropertyValue(BRAND_CSS_VAR_NAMES.primary)).toBe("#112233");
    expect(document.documentElement.style.getPropertyValue(BRAND_CSS_VAR_NAMES.foreground)).toBe("#ffffff");
    expect(document.documentElement.style.getPropertyValue(BRAND_CSS_VAR_NAMES.background)).toBe("#000000");
  });

  it("clearTenantBrandCssVars removes inline overrides", () => {
    applyTenantBrandCssVars({ primary: "#112233" });
    clearTenantBrandCssVars();

    expect(document.documentElement.style.getPropertyValue(BRAND_CSS_VAR_NAMES.primary)).toBe("");
  });

  it("product defaults align with backend ProductBrandingDefaults", () => {
    expect(PRODUCT_BRAND_CSS_DEFAULTS.primary).toBe("#0f766e");
    expect(PRODUCT_BRAND_CSS_DEFAULTS.foreground).toBe("#171717");
  });

  it("applyTenantBrandCssVars does not remap status severity tokens", () => {
    document.documentElement.style.setProperty("--al-status-critical-fg", "#c00000");

    applyTenantBrandCssVars({
      primary: "#112233",
      foreground: "#ffffff",
      background: "#000000",
    });

    expect(document.documentElement.style.getPropertyValue("--al-status-critical-fg")).toBe("#c00000");
    expect(document.documentElement.style.getPropertyValue(BRAND_CSS_VAR_NAMES.primary)).toBe("#112233");
  });
});
