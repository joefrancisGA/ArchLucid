import { describe, expect, it } from "vitest";

import { findBlockedRouteEntry, resolveDemoBlockedRoutePanel } from "@/lib/cto-demo-blocked-route-registry";

describe("cto-demo-blocked-route-registry", () => {
  it("finds admin and nested admin routes", () => {
    expect(findBlockedRouteEntry("/internal")?.label).toBe("Admin console");
    expect(findBlockedRouteEntry("/internal/health")?.label).toBe("Admin console");
  });

  it("returns null for golden journey spine routes", () => {
    expect(findBlockedRouteEntry("/insights/evidence-graph")).toBeNull();
    expect(findBlockedRouteEntry("/governance")).toBeNull();
    expect(findBlockedRouteEntry("/audit")).toBeNull();
  });

  it("allows Extract & Upload settings for Core Pilot onboarding", () => {
    expect(findBlockedRouteEntry("/administration/extract-upload")).toBeNull();
    expect(findBlockedRouteEntry("/administration/workspace-settings")?.label).toBe("Settings");
  });

  it("falls back to generic blocked panel copy", () => {
    const panel = resolveDemoBlockedRoutePanel("/unknown-route");

    expect(panel.label).toBe("This page");
    expect(panel.description).toContain("provisioned ArchLucid tenant");
  });
});
