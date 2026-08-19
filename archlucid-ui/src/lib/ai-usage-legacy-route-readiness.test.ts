import { describe, expect, it } from "vitest";

import {
  AI_USAGE_LEGACY_ADMIN_PATH,
  AI_USAGE_SETTINGS_PATH,
} from "@/lib/ai-usage-nav-paths";
import { NAV_GROUPS } from "@/lib/nav-config";
import {
  OPERATOR_ROUTE_READINESS_LIVE_PATHS,
  operatorRouteReadiness,
} from "@/lib/route-readiness";

describe("ai-usage legacy admin route readiness (TB-1405)", () => {
  it("does not register the legacy admin bookmark as a live readiness path", () => {
    expect(Object.keys(OPERATOR_ROUTE_READINESS_LIVE_PATHS)).not.toContain(AI_USAGE_LEGACY_ADMIN_PATH);
    expect(Object.keys(OPERATOR_ROUTE_READINESS_LIVE_PATHS)).toContain(AI_USAGE_SETTINGS_PATH);
  });

  it("resolves legacy bookmark lookups via canonical AI usage settings only", () => {
    expect(operatorRouteReadiness(AI_USAGE_LEGACY_ADMIN_PATH)).toBe("admin-only");
    expect(operatorRouteReadiness(AI_USAGE_SETTINGS_PATH)).toBe("admin-only");
  });

  it("does not publish the legacy admin bookmark in operator nav shells", () => {
    for (const group of NAV_GROUPS) {
      for (const link of group.links) {
        expect(link.href).not.toBe(AI_USAGE_LEGACY_ADMIN_PATH);
      }
    }
  });
});
