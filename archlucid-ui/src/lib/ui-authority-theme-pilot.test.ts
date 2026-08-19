import { describe, expect, it } from "vitest";

import {
  isUiAuthorityThemePilotRoute,
  isUiAuthorityThemePilotSurfacesEnabled,
} from "@/lib/ui-authority-theme-pilot";

describe("ui-authority-theme-pilot", () => {
  it("matches bounded pilot route prefixes", () => {
    expect(isUiAuthorityThemePilotRoute("/architecture/sponsor-dashboard")).toBe(true);
    expect(isUiAuthorityThemePilotRoute("/insights/sponsor-report")).toBe(true);
    expect(isUiAuthorityThemePilotRoute("/governance/sealed-records/abc")).toBe(true);
    expect(isUiAuthorityThemePilotRoute("/assurance-status")).toBe(true);
    expect(isUiAuthorityThemePilotRoute("/administration/security-trust")).toBe(true);
    expect(isUiAuthorityThemePilotRoute("/architecture/reviews")).toBe(false);
  });

  it("defaults pilot surfaces enabled unless explicitly disabled", () => {
    expect(isUiAuthorityThemePilotSurfacesEnabled()).toBe(true);
  });
});
