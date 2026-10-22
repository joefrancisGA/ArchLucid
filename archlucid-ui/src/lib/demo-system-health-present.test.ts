import { describe, expect, it } from "vitest";

import {
  DEMO_SYSTEM_HEALTH_CONTEXT_NOTE,
  DEMO_SYSTEM_HEALTH_OVERALL_TITLE,
  buildDemoHealthSummaryTiles,
  buildDemoOperationalChecks,
} from "@/lib/demo-system-health-present";

describe("demo-system-health-present", () => {
  it("builds buyer-safe summary tiles and operational checks without duplicate last-updated", () => {
    const tiles = buildDemoHealthSummaryTiles();
    const checks = buildDemoOperationalChecks();

    // No "Overall status" tile — the overall-status hero renders directly above the grid.
    expect(tiles.map((tile) => tile.label)).toEqual([
      "Application services",
      "Evidence search",
      "AI services",
      "Background jobs",
      "Integrations",
    ]);
    expect(tiles[0]?.value).toBe("Healthy");
    expect(tiles.find((tile) => tile.id === "evidence-search")?.value).toBe("Sample scope");
    expect(checks.map((check) => check.label)).toEqual([
      "Application shell",
      "Review navigation",
      "Evidence graph",
      "Search evidence",
      "AI budget guardrails",
      "Background job queue",
      "Digest delivery",
      "Integration readiness",
    ]);
    expect(DEMO_SYSTEM_HEALTH_OVERALL_TITLE).toMatch(/pilot review/i);
    expect(DEMO_SYSTEM_HEALTH_CONTEXT_NOTE).toContain("evaluation workspace");
    expect(DEMO_SYSTEM_HEALTH_CONTEXT_NOTE).not.toContain("sample review shell");
    expect(DEMO_SYSTEM_HEALTH_CONTEXT_NOTE).not.toMatch(/CPA SOC 2/i);
  });
});
