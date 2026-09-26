import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceDiagramLegend } from "@/components/infra-evidence/InfraEvidenceDiagramLegend";
import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_DATA,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_NETWORK,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_OTHER,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_STORAGE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";

describe("InfraEvidenceDiagramLegend", () => {
  it("is hidden when no declared or inferred edges exist", () => {
    const { container } = render(
      <InfraEvidenceDiagramLegend
        outline={{
          nodes: [],
          edges: [
            {
              from: "a",
              to: "b",
              label: "connects",
              source: "observed",
              confidenceBand: "observed",
              provenanceKind: null,
              inferenceSource: null,
              declaredConnectionId: null,
            },
          ],
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows declared legend row when outline contains a declared edge", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={{
          nodes: [],
          edges: [
            {
              from: "a",
              to: "b",
              label: "declared · connects",
              source: "declared",
              confidenceBand: "declared",
              provenanceKind: "HumanAssertion",
              inferenceSource: "human-declared-connection",
              declaredConnectionId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("infra-evidence-diagram-legend")).toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING)).toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED)).toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED)).toBeInTheDocument();
  });

  it("detects declared edges from mermaid dashed arrows", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={null}
        mermaidSource={'flowchart TD\n    a -.->|"declared · connects"| b'}
      />,
    );

    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED)).toBeInTheDocument();
  });

  it("shows probable legend row when outline contains derived authorization edges", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={{
          nodes: [],
          edges: [
            {
              from: "web",
              to: "sql",
              label: "May access",
              source: "probable",
              confidenceBand: "probable",
              provenanceKind: "DerivedFact",
              inferenceSource: "inventory-app-authorized-access",
              declaredConnectionId: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE)).toBeInTheDocument();
  });

  const observedOutline = {
    nodes: [],
    edges: [
      {
        from: "a",
        to: "b",
        label: "connects",
        source: "observed" as const,
        confidenceBand: "observed" as const,
        provenanceKind: null,
        inferenceSource: null,
        declaredConnectionId: null,
      },
    ],
  };

  const identityAndComputeSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    '  <rect class="node-card" fill="#f8fafc"/>',
    '  <rect class="node-accent" width="4" height="48" fill="#db2777"/>',
    '  <rect class="node-accent extra" width="4" height="48" fill="#2563eb"/>',
    "</svg>",
  ].join("\n");

  it("shows resource category swatches for observed-only graphs", () => {
    render(
      <InfraEvidenceDiagramLegend outline={observedOutline} layoutSvg={identityAndComputeSvg} />,
    );

    expect(screen.getByTestId("infra-evidence-diagram-legend")).toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED)).not.toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_RESOURCE_CATEGORY)).toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY)).toBeInTheDocument();
    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE)).toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_NETWORK)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_DATA)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_STORAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_OTHER)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED)).not.toBeInTheDocument();
    expect(screen.queryByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED)).not.toBeInTheDocument();

    const row = screen.getByTestId("infra-evidence-diagram-legend-resource-category");
    const labels = Array.from(row.querySelectorAll("li")).map((item) => item.textContent);
    expect(labels).toEqual([
      INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE,
      INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_IDENTITY,
    ]);
  });

  it("keeps inferred copy and adds the swatch row", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={{
          nodes: [],
          edges: [
            {
              from: "web",
              to: "sql",
              label: "likely connected to",
              source: "inferred",
              confidenceBand: "inferred",
              provenanceKind: "DerivedFact",
              inferenceSource: "inventory-hostname",
              declaredConnectionId: null,
            },
          ],
        }}
        layoutSvg={identityAndComputeSvg}
      />,
    );

    expect(screen.getByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED)).toBeInTheDocument();
    expect(screen.getByTestId("infra-evidence-diagram-legend-resource-category")).toBeInTheDocument();
  });

  it("lists one row when the same accent fill is repeated", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={observedOutline}
        layoutSvg={'<svg><rect class="node-accent" fill="#2563eb"/><rect class="node-accent" fill="#2563EB"/></svg>'}
      />,
    );

    expect(screen.getAllByText(INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE)).toHaveLength(1);
  });

  it("ignores accent fills outside the category palette", () => {
    render(
      <InfraEvidenceDiagramLegend
        outline={observedOutline}
        layoutSvg={'<svg><rect class="node-accent" fill="#ff00ff"/><rect class="node-accent" fill="#2563eb"/></svg>'}
      />,
    );

    const row = screen.getByTestId("infra-evidence-diagram-legend-resource-category");
    expect(Array.from(row.querySelectorAll("li")).map((item) => item.textContent)).toEqual([
      INFRA_EVIDENCE_DIAGRAM_LEGEND_ACCENT_COMPUTE,
    ]);
  });
});
