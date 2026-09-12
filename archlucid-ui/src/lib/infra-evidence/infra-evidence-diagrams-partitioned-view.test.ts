import { describe, expect, it } from "vitest";

import type { InfraEvidenceMermaidFallbackArtifactSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";
import {
  resolveInfraDiagramsDefaultFallbackKey,
  resolveInfraDiagramsEffectiveFallbackKey,
  resolveInfraDiagramsFallbackArtifacts,
  shouldPaintInfraDiagramsMermaidSource,
  shouldShowInfraDiagramsPartitionedViews,
} from "@/lib/infra-evidence/infra-evidence-diagrams-partitioned-view";

const executiveArtifact: InfraEvidenceMermaidFallbackArtifactSummary = {
  key: "executive",
  label: "Executive",
  status: "Succeeded",
  nodeCount: 40,
  edgeCount: 55,
};

const networkArtifact: InfraEvidenceMermaidFallbackArtifactSummary = {
  key: "network",
  label: "Network",
  status: "Succeeded",
  nodeCount: 90,
  edgeCount: 140,
};

describe("infra-evidence-diagrams-partitioned-view", () => {
  it("hides partitioned chrome when there are no fallback artifacts", () => {
    expect(
      shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey: "executive",
        previewStatus: "Partitioned",
        renderStatus: "Partitioned",
        fallbackArtifactCount: 0,
      }),
    ).toBe(false);
  });

  it("keeps partitioned chrome after a selected partition returns Succeeded", () => {
    expect(
      shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey: "executive",
        previewStatus: "Partitioned",
        renderStatus: "Succeeded",
        fallbackArtifactCount: 2,
      }),
    ).toBe(true);
  });

  it("shows partitioned chrome from preview before a view key is selected", () => {
    expect(
      shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey: "",
        previewStatus: "Partitioned",
        renderStatus: "",
        fallbackArtifactCount: 2,
      }),
    ).toBe(true);
  });

  it("shows partitioned chrome from the render status when preview has not loaded", () => {
    expect(
      shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey: "",
        previewStatus: "",
        renderStatus: "Partitioned",
        fallbackArtifactCount: 2,
      }),
    ).toBe(true);
  });

  it("does not show partitioned chrome for a succeeded mode with no view key", () => {
    expect(
      shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey: "",
        previewStatus: "Succeeded",
        renderStatus: "Succeeded",
        fallbackArtifactCount: 2,
      }),
    ).toBe(false);
  });

  it("prefers non-empty render artifacts and otherwise uses preview artifacts", () => {
    expect(resolveInfraDiagramsFallbackArtifacts([networkArtifact], [executiveArtifact])).toEqual([
      networkArtifact,
    ]);
    expect(resolveInfraDiagramsFallbackArtifacts([], [executiveArtifact])).toEqual([executiveArtifact]);
    expect(resolveInfraDiagramsFallbackArtifacts(null, undefined)).toEqual([]);
  });

  it("defaults the fallback key to executive, then a succeeded artifact", () => {
    expect(resolveInfraDiagramsDefaultFallbackKey([networkArtifact, executiveArtifact])).toBe("executive");
    expect(resolveInfraDiagramsDefaultFallbackKey([networkArtifact])).toBe("network");
    expect(
      resolveInfraDiagramsDefaultFallbackKey([
        { key: "other", label: "Other", status: "Failed", nodeCount: 0, edgeCount: 0 },
      ]),
    ).toBe("");
    expect(resolveInfraDiagramsDefaultFallbackKey([])).toBe("");
  });

  it("ignores full-machine and resource-group view keys when resolving the effective fallback", () => {
    expect(
      resolveInfraDiagramsEffectiveFallbackKey({
        showPartitionedViews: true,
        selectedViewKey: "full-machine",
        fallbackArtifacts: [executiveArtifact, networkArtifact],
      }),
    ).toBe("executive");
  });

  it("keeps the selected fallback key while partitioned chrome is visible", () => {
    expect(
      resolveInfraDiagramsEffectiveFallbackKey({
        showPartitionedViews: true,
        selectedViewKey: "network",
        fallbackArtifacts: [executiveArtifact, networkArtifact],
      }),
    ).toBe("network");
  });

  it("clears the fallback key when partitioned chrome is hidden", () => {
    expect(
      resolveInfraDiagramsEffectiveFallbackKey({
        showPartitionedViews: false,
        selectedViewKey: "executive",
        fallbackArtifacts: [executiveArtifact],
      }),
    ).toBe("");
  });

  it("uses the default fallback when partitioned chrome is visible and no view is selected", () => {
    expect(
      resolveInfraDiagramsEffectiveFallbackKey({
        showPartitionedViews: true,
        selectedViewKey: "  ",
        fallbackArtifacts: [networkArtifact, executiveArtifact],
      }),
    ).toBe("executive");
  });

  it("does not paint partitioned primary mermaid before the matching partition arrives", () => {
    expect(
      shouldPaintInfraDiagramsMermaidSource({
        mermaidSource: "flowchart TD\n  a-->b",
        effectiveFallbackKey: "executive",
        renderFallbackKey: null,
      }),
    ).toBe(false);
  });

  it("paints mermaid once the fetched partition matches the selected fallback", () => {
    expect(
      shouldPaintInfraDiagramsMermaidSource({
        mermaidSource: "flowchart TD\n  a-->b",
        effectiveFallbackKey: "executive",
        renderFallbackKey: "executive",
      }),
    ).toBe(true);
  });

  it("paints mermaid immediately when the mode is not partitioned", () => {
    expect(
      shouldPaintInfraDiagramsMermaidSource({
        mermaidSource: "flowchart TD\n  a-->b",
        effectiveFallbackKey: "",
        renderFallbackKey: null,
      }),
    ).toBe(true);
  });

  it("does not paint empty mermaid source", () => {
    expect(
      shouldPaintInfraDiagramsMermaidSource({
        mermaidSource: "   ",
        effectiveFallbackKey: "",
        renderFallbackKey: null,
      }),
    ).toBe(false);
  });
});
