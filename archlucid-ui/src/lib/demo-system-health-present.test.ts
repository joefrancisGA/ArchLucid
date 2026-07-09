import { describe, expect, it } from "vitest";

import {
  DEMO_SYSTEM_HEALTH_CONTEXT_NOTE,
  buildDemoHealthSummaryTiles,
  buildDemoOperationalChecks,
} from "@/lib/demo-system-health-present";

describe("demo-system-health-present", () => {
  it("builds buyer-safe summary tiles and operational checks", () => {
    const tiles = buildDemoHealthSummaryTiles({ lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"), loading: false });
    const checks = buildDemoOperationalChecks();

    expect(tiles.map((tile) => tile.label)).toEqual([
      "Overall status",
      "Application services",
      "Evidence search",
      "AI services",
      "Background jobs",
      "Integrations",
      "Last updated",
    ]);
    expect(tiles[0]?.value).toBe("Healthy");
    expect(checks.map((check) => check.label)).toEqual([
      "Application shell",
      "Review package navigation",
      "Evidence graph",
      "Search",
      "AI budget guardrails",
      "Background job queue",
      "Digest delivery",
      "Integration readiness",
    ]);
    expect(DEMO_SYSTEM_HEALTH_CONTEXT_NOTE).toContain("Demo workspace");
    expect(DEMO_SYSTEM_HEALTH_CONTEXT_NOTE).not.toContain("sample review shell");
  });
});
