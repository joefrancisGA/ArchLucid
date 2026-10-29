import { describe, expect, it } from "vitest";

import {
  architectureDiagramModelToMermaid,
  architectureDiagramModelToTextAlternative,
  isValidMermaidArchitectureDiagram,
} from "@/lib/architecture/architecture-diagram-mermaid";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

const modelWithBoundary: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "user_analyst",
      label: "Claims analyst",
      kind: "user",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
    {
      id: "system_api",
      label: "Claims API",
      kind: "system",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
    {
      id: "external_gateway",
      label: "Payment gateway",
      kind: "external",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
  ],
  edges: [
    {
      id: "edge_1",
      sourceId: "user_analyst",
      targetId: "system_api",
      label: "submit claim",
      provenance: "inferred",
      removed: false,
    },
  ],
  trustBoundaryLabels: ["Corporate network"],
  skippedUnlabeledEntityCount: 0,
  unmatchedDataFlows: [],
};

describe("architectureDiagramModelToMermaid", () => {
  it("accepts flowchart sources and rejects invalid text", () => {
    expect(isValidMermaidArchitectureDiagram('flowchart TB\n  a["A"]')).toBe(true);
    expect(isValidMermaidArchitectureDiagram("not a diagram")).toBe(false);
  });

  it("does not wrap system nodes in a trust-boundary subgraph (P-03)", () => {
    const mermaid = architectureDiagramModelToMermaid(modelWithBoundary);
    const alt = architectureDiagramModelToTextAlternative({
      ...modelWithBoundary,
      diagramHonestyNotes: [
        "Trust boundary names were stored without component membership: Corporate network.",
      ],
    });

    expect(mermaid).not.toContain("subgraph trustBoundary");
    expect(mermaid).toContain('  system_api["Claims API"]');
    expect(mermaid).toContain('  user_analyst["Claims analyst"]');
    expect(alt).toContain("Trust boundary names were stored without component membership: Corporate network.");
  });

  it("labels empty edge connections in mermaid and text alternative", () => {
    const emptyEdgeModel: ArchitectureDiagramModel = {
      ...modelWithBoundary,
      edges: [
        {
          id: "edge_empty",
          sourceId: "user_analyst",
          targetId: "system_api",
          label: "",
          provenance: "asserted",
          removed: false,
        },
      ],
    };

    const mermaid = architectureDiagramModelToMermaid(emptyEdgeModel);
    const alt = architectureDiagramModelToTextAlternative(emptyEdgeModel);

    expect(mermaid.replace(/\\n/g, " ").replace(/\s+/g, " ")).toContain(
      "Connection label was not stored.",
    );
    expect(alt).toContain("Connection label was not stored.");
  });

  it("marks inferred edges in labels and text alternative with human names", () => {
    const mermaid = architectureDiagramModelToMermaid(modelWithBoundary);
    const alt = architectureDiagramModelToTextAlternative(modelWithBoundary);

    expect(mermaid.replace(/\\n/g, " ")).toContain("submit claim (submitted text, not operator-asserted)");
    expect(alt).toContain("Claims analyst to Claims API (submit claim) (submitted text, not operator-asserted)");
    expect(alt).not.toContain("user_analyst to system_api");
  });

  it("omits trust boundary subgraph when no system nodes map inside", () => {
    const externalOnly: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "external_gateway",
          label: "Payment gateway",
          kind: "external",
          provenance: "asserted",
          removed: false,
          accepted: true,
        },
      ],
      edges: [],
      trustBoundaryLabels: ["Corporate network"],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    const mermaid = architectureDiagramModelToMermaid(externalOnly);

    expect(mermaid).not.toContain("subgraph trustBoundary");
  });

  it("omits edges connected to removed nodes from the text alternative", () => {
    const removedNodeModel: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "removed_system",
          label: "Removed system",
          kind: "system",
          provenance: "inferred",
          removed: true,
          accepted: false,
        },
        {
          id: "active_system",
          label: "Active system",
          kind: "system",
          provenance: "asserted",
          removed: false,
          accepted: true,
        },
      ],
      edges: [
        {
          id: "edge_removed",
          sourceId: "removed_system",
          targetId: "active_system",
          label: "old flow",
          provenance: "inferred",
          removed: false,
        },
      ],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    const alternative = architectureDiagramModelToTextAlternative(removedNodeModel);

    expect(alternative).not.toContain("removed_system");
    expect(alternative).not.toContain("old flow");
  });

  it("preserves the inferred suffix when truncating long labels (P-16)", () => {
    const longCore =
      "Enterprise payments orchestration service with extended governance and operations description segment ";
    const longLabel = longCore.repeat(3);
    const longInferred: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "long_inferred",
          label: longLabel,
          kind: "system",
          provenance: "inferred",
          removed: false,
          accepted: false,
        },
      ],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    const mermaid = architectureDiagramModelToMermaid(longInferred);

    const normalized = mermaid.replace(/\\n/g, " ").replace(/\s+/g, " ");
    expect(normalized).toContain("(submitted text, not operator-asserted)");
    expect(normalized).toContain("Full node label was stored; only a preview is shown.");
    expect(mermaid).not.toMatch(/\.\.\./);
  });

  it("renders an explicit empty diagram placeholder", () => {
    const empty: ArchitectureDiagramModel = {
      nodes: [],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
      entitySectionHonestyLines: [],
    };

    expect(
      architectureDiagramModelToMermaid(empty).replace(/\\n/g, " ").replace(/\s+/g, " "),
    ).toContain("No diagram components were stored.");
    expect(architectureDiagramModelToTextAlternative(empty)).toBe(
      "No diagram components were stored.",
    );
  });

  it("includes omitted section honesty lines when no nodes are drawn", () => {
    const emptyWithOmittedUsers: ArchitectureDiagramModel = {
      nodes: [],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
      entitySectionHonestyLines: ["Users and stakeholders: Entities were not stored."],
    };

    expect(architectureDiagramModelToTextAlternative(emptyWithOmittedUsers)).toBe(
      "Users and stakeholders: Entities were not stored.",
    );
    expect(architectureDiagramModelToTextAlternative(emptyWithOmittedUsers)).not.toContain(
      "No architecture components were recorded.",
    );
  });

  it("labels empty edge relationships in the text alternative", () => {
    const unlabeledEdge: ArchitectureDiagramModel = {
      ...modelWithBoundary,
      edges: [
        {
          id: "edge_unlabeled",
          sourceId: "user_analyst",
          targetId: "system_api",
          label: "",
          provenance: "asserted",
          removed: false,
        },
      ],
    };

    const alt = architectureDiagramModelToTextAlternative(unlabeledEdge);

    expect(alt).toContain("Connection label was not stored.");
    expect(architectureDiagramModelToTextAlternative(modelWithBoundary)).toContain("(submit claim)");
  });

  it("appends skipped unlabeled entity disclosure when count is positive", () => {
    const skipped: ArchitectureDiagramModel = {
      ...modelWithBoundary,
      skippedUnlabeledEntityCount: 1,
    };

    const alt = architectureDiagramModelToTextAlternative(skipped);

    expect(alt).toContain("The diagram includes 1 component whose names were not stored.");

    expect(architectureDiagramModelToTextAlternative(modelWithBoundary)).not.toContain("Skipped");
  });

  it("notes dangling connections in the text alternative (P-05)", () => {
    const dangling: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "system_api",
          label: "Claims API",
          kind: "system",
          provenance: "asserted",
          removed: false,
          accepted: true,
        },
      ],
      edges: [
        {
          id: "edge_dangling",
          sourceId: "system_api",
          targetId: "missing_node",
          label: "call",
          provenance: "asserted",
          removed: false,
        },
      ],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    expect(architectureDiagramModelToTextAlternative(dangling)).toContain(
      "A connection was left off this diagram because an endpoint was not on the diagram.",
    );

    const mermaid = architectureDiagramModelToMermaid(dangling);

    expect(mermaid).toContain("diagramOmissionNote");
    expect(mermaid.replace(/\\n/g, " ")).toContain("endpoint was not on the diagram");
  });

  it("distinguishes all-removed models from never-recorded models (P-06)", () => {
    const allRemoved: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "system_api",
          label: "Claims API",
          kind: "system",
          provenance: "asserted",
          removed: true,
          accepted: true,
        },
      ],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    expect(architectureDiagramModelToTextAlternative(allRemoved)).toBe(
      "Recorded architecture components were removed from this diagram.",
    );
  });

  it("inserts mermaid line breaks so long human names wrap inside wrappingWidth boxes", () => {
    const longLabel =
      "Azure Kubernetes Service (AKS) Cluster with extended operations and governance description";
    const longName: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "aks_cluster",
          label: longLabel,
          kind: "system",
          provenance: "asserted",
          removed: false,
          accepted: true,
        },
      ],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    };

    const mermaid = architectureDiagramModelToMermaid(longName);

    expect(mermaid).toContain("\\n");
    expect(mermaid).toContain("Azure Kubernetes");
    expect(mermaid).toContain("aks_cluster[\"");
  });
});
