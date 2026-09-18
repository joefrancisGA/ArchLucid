import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceDiagramLegend } from "@/components/infra-evidence/InfraEvidenceDiagramLegend";
import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_HEADING,
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
});
