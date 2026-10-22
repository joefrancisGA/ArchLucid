import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { describe, expect, it } from "vitest";

import {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  GRAPH_IDLE,
} from "@/lib/empty-state-presets";
import { INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO } from "@/lib/insights-finalized-review-prerequisite-empty";

import {
  resolveEvidenceTrailPresentationView,
  resolveGraphIdleEmptyPreset,
} from "./graph-page-helpers";

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

    expect(preset.title).toBe(INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO);
    expect(preset.description).toContain("Select a finalized architecture review");
    expect(preset.actions?.[0]?.label).toBe("Open reviews");
    expect(preset.actions?.some((action) => action.label === AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL)).toBe(true);
  });

  it("prefers showcase demo idle copy when demoUi and showIdleCard are both true", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: true,
    });

    expect(preset.title).toBe(INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO);
    expect(preset.actions?.[0]?.label).toBe("Open reviews");
    expect(preset.actions?.some((action) => action.label === AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL)).toBe(true);
  });

  it("uses awaiting-selection copy when packages exist but no review is chosen", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: true,
      demoUi: true,
      showIdleCard: true,
      awaitingSelection: true,
    });

    expect(preset.title).toBe("Select a review");
    expect(preset.description).toContain("Choose a completed review");
  });

  it("Working graph idle uses one New review action without sample CTA (CD-02)", () => {
    const preset = resolveGraphIdleEmptyPreset({
      buyerPolished: false,
      demoUi: false,
      showIdleCard: true,
      workingMode: true,
    });

    expect(preset.actions).toHaveLength(1);
    expect(preset.actions?.[0]?.label).toBe("New review");
  });
});

describe("resolveEvidenceTrailPresentationView", () => {
  it("defaults eval shells to graph and Working desk to trace", () => {
    expect(resolveEvidenceTrailPresentationView(null, true)).toBe("graph");
    expect(resolveEvidenceTrailPresentationView(undefined, false)).toBe("trace");
    expect(resolveEvidenceTrailPresentationView("trace", true)).toBe("trace");
    expect(resolveEvidenceTrailPresentationView("graph", false)).toBe("graph");
  });

  it("defaults Working mode to trace even on buyer-polished shells", () => {
    expect(resolveEvidenceTrailPresentationView(null, true, true)).toBe("trace");
    expect(resolveEvidenceTrailPresentationView(null, true, false)).toBe("graph");
    expect(resolveEvidenceTrailPresentationView("graph", true, true)).toBe("graph");
  });
});
