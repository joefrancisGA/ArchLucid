import { describe, expect, it } from "vitest";

import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_PRIVATE_ENDPOINT_DNS,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { resolveInfraEvidenceDiagramLegendProbableLine } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-probable-line";

describe("resolveInfraEvidenceDiagramLegendProbableLine (P-06)", () => {
  it("uses the Logic App clause when a logic app connection edge is present", () => {
    const line = resolveInfraEvidenceDiagramLegendProbableLine({
      nodes: [],
      edges: [
        {
          from: "la",
          to: "sql",
          label: "API connection",
          source: "probable",
          confidenceBand: "probable",
          provenanceKind: "DerivedFact",
          inferenceSource: "inventory-logic-app-connection",
          declaredConnectionId: null,
        },
      ],
    });

    expect(line).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP);
  });

  it("keeps the RBAC-only sentence when no logic app connection edge is present", () => {
    expect(resolveInfraEvidenceDiagramLegendProbableLine({ nodes: [], edges: [] })).toBe(
      INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
    );
  });

  it("uses the private-endpoint DNS hop sentence for PE reachability edges", () => {
    const line = resolveInfraEvidenceDiagramLegendProbableLine({
      nodes: [],
      edges: [
        {
          from: "pe",
          to: "app",
          label: "Private network path",
          source: "probable",
          confidenceBand: "probable",
          provenanceKind: "DerivedFact",
          inferenceSource: "inventory-pe-reachable-target",
          declaredConnectionId: null,
        },
      ],
    });

    expect(line).toBe(INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_PRIVATE_ENDPOINT_DNS);
  });
});
