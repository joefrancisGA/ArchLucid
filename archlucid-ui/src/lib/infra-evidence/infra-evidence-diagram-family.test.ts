import { describe, expect, it } from "vitest";

import {
  filterInfraEvidenceDiagramOutlineByFamily,
  INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL,
  INFRA_EVIDENCE_DIAGRAM_FAMILY_LABELS,
  resolveInfraEvidenceDiagramFamily,
  resolveSelectableInfraEvidenceDiagramFamily,
} from "@/lib/infra-evidence/infra-evidence-diagram-family";
import type { InfraEvidenceMermaidOutlineEdge } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function edge(
  label: string,
  inferenceSource: string | null,
): InfraEvidenceMermaidOutlineEdge {
  return {
    from: "from",
    to: "to",
    label,
    source: "probable",
    confidenceBand: "probable",
    provenanceKind: "DerivedFact",
    inferenceSource,
    declaredConnectionId: null,
  };
}

describe("infra-evidence-diagram-family", () => {
  it("uses first-review-next-step family chip labels (P-08 / P-09)", () => {
    expect(INFRA_EVIDENCE_DIAGRAM_FAMILY_LABELS.ObservedRuntime).toBe("Dependency named in inventory");
    expect(INFRA_EVIDENCE_DIAGRAM_FAMILY_LABELS.StructuralNetworkPath).toBe("Private endpoint in inventory");
    expect(resolveInfraEvidenceDiagramFamily(edge("x", "inventory-observed-dependency"))).toBe("ObservedRuntime");
    expect(resolveInfraEvidenceDiagramFamily(edge("private network path", null))).toBe("StructuralNetworkPath");
  });

  it("prefers inference sources over labels", () => {
    expect(resolveInfraEvidenceDiagramFamily(edge("From app settings", "inventory-hostname-inferred-target"))).toBe(
      "AppSettingsHost",
    );
  });

  it("maps app-setting host inference sources to From app settings family", () => {
    expect(resolveInfraEvidenceDiagramFamily(edge("From app settings", "inventory-storage-host-ref"))).toBe(
      "AppSettingsHost",
    );
  });

  it("maps family verbs and leaves unknown edges in All only", () => {
    expect(resolveInfraEvidenceDiagramFamily(edge("Reads from", null))).toBe("DeclaredMovement");
    expect(resolveInfraEvidenceDiagramFamily(edge("May access", null))).toBe("AuthorizedAccess");
    expect(resolveInfraEvidenceDiagramFamily(edge("connects", null))).toBe(INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL);
  });

  it("does not classify logic app connections as pipeline wiring (P-11)", () => {
    expect(resolveInfraEvidenceDiagramFamily(edge("API connection", "inventory-logic-app-connection"))).toBe(
      INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL,
    );
  });

  it("maps inventory configuration relationship inference sources to pipeline wiring (P-05)", () => {
    expect(resolveInfraEvidenceDiagramFamily(edge("Linked backend", "inventory-static-site-backend"))).toBe(
      "DeclaredMovement",
    );
    expect(resolveInfraEvidenceDiagramFamily(edge("Assigned workspace", "inventory-fabric-capacity-workspace"))).toBe(
      "DeclaredMovement",
    );
    expect(
      resolveInfraEvidenceDiagramFamily(
        edge("Diagnostic setting name was not stored.", "inventory-diagnostic-setting-storage"),
      ),
    ).toBe("DeclaredMovement");
  });

  it("falls back to All when the selected family has no edges on the diagram", () => {
    expect(resolveSelectableInfraEvidenceDiagramFamily("AuthorizedAccess", ["DeclaredMovement"])).toBe(
      INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL,
    );
    expect(resolveSelectableInfraEvidenceDiagramFamily("AuthorizedAccess", ["AuthorizedAccess"])).toBe(
      "AuthorizedAccess",
    );
    expect(resolveSelectableInfraEvidenceDiagramFamily(INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL, [])).toBe(
      INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL,
    );
  });

  it("filters only matching edges while retaining nodes", () => {
    const outline = {
      nodes: [{ id: "from", label: "from", resourceType: null, resourceGroup: null }],
      edges: [edge("May access", "inventory-app-authorized-access"), edge("Reads from", null)],
    };

    const filtered = filterInfraEvidenceDiagramOutlineByFamily(outline, "AuthorizedAccess");

    expect(filtered.nodes).toHaveLength(1);
    expect(filtered.edges.map((item) => item.label)).toEqual(["May access"]);
  });
});
