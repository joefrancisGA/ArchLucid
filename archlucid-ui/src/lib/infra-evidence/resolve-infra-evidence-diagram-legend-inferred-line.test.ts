import { describe, expect, it } from "vitest";

import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNNAMED_KIND,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { resolveInfraEvidenceDiagramLegendInferredCopy } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-inferred-line";

describe("resolveInfraEvidenceDiagramLegendInferredCopy (P-05)", () => {
  it("uses app-settings copy for hostname-inferred edges", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "web",
          to: "sql",
          label: "From app settings",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "DeterministicInference",
          inferenceSource: "inventory-hostname-inferred-target",
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS);
  });

  it("uses linked-service guess copy for adf-linked-service-inferred edges", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "adf",
          to: "blob",
          label: "inferred",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "DeterministicInference",
          inferenceSource: "inventory-adf-linked-service-inferred",
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toContain("linked-service text was inferred");
  });

  it("uses AI copy when provenance is AiInference", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "a",
          to: "b",
          label: "inferred",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "AiInference",
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI);
  });

  it("uses combined copy when both kinds are present", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "web",
          to: "sql",
          label: "hostname",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "DeterministicInference",
          inferenceSource: "inventory-hostname-inferred-target",
          declaredConnectionId: null,
        },
        {
          from: "c",
          to: "d",
          label: "ai",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "AiInference",
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI);
  });

  it("uses unnamed-kind copy when inferred edges store an unlisted inference source", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "a",
          to: "b",
          label: "inferred",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "DeterministicInference",
          inferenceSource: "inventory-app-authorized-access",
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNNAMED_KIND);
  });

  it("uses inference-source-not-stored copy when every inferred edge omits inference source", () => {
    const copy = resolveInfraEvidenceDiagramLegendInferredCopy({
      nodes: [],
      edges: [
        {
          from: "a",
          to: "b",
          label: "inferred",
          source: "inferred",
          confidenceBand: "inferred",
          provenanceKind: "DeterministicInference",
          inferenceSource: null,
          declaredConnectionId: null,
        },
      ],
    });

    expect(copy.legendLine).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN);
  });
});
