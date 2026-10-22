import { describe, expect, it } from "vitest";

import {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
  GRAPH_IDLE,
  GRAPH_IDLE_BUYER,
  RUNS_EMPTY,
} from "@/lib/empty-state-presets";
import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

describe("empty-state-presets (TB-778)", () => {
  it("labels claims-intake sample review CTAs with Azure reference qualifier", () => {
    expect(RUNS_EMPTY.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL);
    expect(RUNS_EMPTY_COMPACT.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL);
    expect(AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL).toMatch(/Azure reference/i);
  });

  it("labels showcase graph sample CTAs with Azure reference qualifier", () => {
    expect(GRAPH_IDLE.actions?.[1]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    expect(GRAPH_IDLE_BUYER.actions?.[0]?.label).toBe(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL);
    expect(AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL).toMatch(/Azure reference/i);
  });
});
