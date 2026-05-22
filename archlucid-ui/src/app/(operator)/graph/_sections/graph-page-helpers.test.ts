import { describe, expect, it } from "vitest";

import { GRAPH_IDLE, GRAPH_IDLE_BUYER } from "@/lib/empty-state-presets";

import { resolveGraphIdleEmptyPreset } from "./graph-page-helpers";

describe("resolveGraphIdleEmptyPreset", () => {
  it("returns operator GRAPH_IDLE when not buyer-polished and not demo idle", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: false,
      demoUi: false,
      showIdleCard: true,
    });

    expect(preset.title).toBe(GRAPH_IDLE.title);
    expect(preset.description).toBe(GRAPH_IDLE.description);
  });

  it("returns GRAPH_IDLE_BUYER title in buyer-polished mode without demo idle override", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: false,
    });

    expect(preset.title).toBe(GRAPH_IDLE_BUYER.title);
    expect(preset.title).toBe("No evidence graph loaded");
    expect(preset.description).toBe(GRAPH_IDLE_BUYER.description);
    expect(preset.actions).toEqual(GRAPH_IDLE_BUYER.actions);
  });

  it("prefers showcase demo idle copy when demoUi and showIdleCard are both true", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: true,
    });

    expect(preset.title).toBe("Decision traceability graph");
    expect(preset.actions?.[0]?.label).toBe("Open signed manifest");
  });
});
