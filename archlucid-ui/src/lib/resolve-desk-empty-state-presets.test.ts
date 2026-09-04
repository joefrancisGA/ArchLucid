import { describe, expect, it } from "vitest";

import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import {
  emptyStateActionsIncludeShowcaseSample,
  resolveGraphIdlePreset,
  resolveRunsEmptyCompactPreset,
  resolveRunsEmptyPreset,
} from "@/lib/resolve-desk-empty-state-presets";

describe("resolve-desk-empty-state-presets (CD-02)", () => {
  it("Working reviews empty uses one New review start without sample hero", () => {
    const preset = resolveRunsEmptyPreset(true);

    expect(preset.actions).toHaveLength(1);
    expect(preset.actions?.[0]?.label).toBe(WORKING_NEW_REVIEW_LABEL);
    expect(emptyStateActionsIncludeShowcaseSample(preset.actions)).toBe(false);
    expect(preset.description).not.toMatch(/sample review/i);
  });

  it("Guided reviews empty keeps Azure reference sample CTA", () => {
    const preset = resolveRunsEmptyPreset(false);

    expect(preset.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL);
    expect(emptyStateActionsIncludeShowcaseSample(preset.actions)).toBe(true);
  });

  it("Working compact reviews empty omits showcase sample", () => {
    const preset = resolveRunsEmptyCompactPreset(true);

    expect(preset.actions).toHaveLength(1);
    expect(preset.actions?.[0]?.label).toBe(WORKING_NEW_REVIEW_LABEL);
    expect(emptyStateActionsIncludeShowcaseSample(preset.actions)).toBe(false);
  });

  it("Working graph idle omits showcase sample graph CTA", () => {
    const preset = resolveGraphIdlePreset(true);

    expect(preset.actions).toHaveLength(1);
    expect(emptyStateActionsIncludeShowcaseSample(preset.actions)).toBe(false);
    expect(preset.actions?.[0]?.href).not.toContain(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("Guided graph idle keeps sample graph CTA", () => {
    const preset = resolveGraphIdlePreset(false);

    expect(preset.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
  });
});
