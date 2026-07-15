import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { describe, expect, it } from "vitest";

import {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  GRAPH_IDLE,
} from "@/lib/empty-state-presets";

import { resolveGraphIdleEmptyPreset } from "./graph-page-helpers";

describe("resolveGraphIdleEmptyPreset", () => {
  it("returns operator GRAPH_IDLE when not buyer-polished and not demo idle", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: false,
      demoUi: false,
      showIdleCard: true,
    });

    expect(preset.title).toBe(GRAPH_IDLE.title);
    expect(preset.title).toBe("No completed reviews yet");
    expect(preset.description).toBe(GRAPH_IDLE.description);
    expect(preset.actions?.[0]?.label).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(preset.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
  });

  it("returns buyer empty-state copy in buyer-polished mode without demo idle override", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: false,
    });

    expect(preset.title).toBe("No completed reviews yet");
    expect(preset.description).toContain("Complete a review to generate an evidence graph");
    expect(preset.description).toContain("evidence relationships work");
    expect(preset.actions?.[0]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    expect(preset.actions?.[1]?.label).toBe(CREATE_ARCHITECTURE_LABEL);
  });

  it("prefers showcase demo idle copy when demoUi and showIdleCard are both true", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: true,
    });

    expect(preset.title).toBe("No completed reviews yet");
    expect(preset.actions?.[0]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    expect(preset.actions?.[1]?.label).toBe(CREATE_ARCHITECTURE_LABEL);
  });
});
