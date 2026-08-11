import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceEvidenceGraphVocabularyRail } from "@/components/ArchitectureIntelligenceEvidenceGraphVocabularyRail";
import {
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO,
} from "@/lib/architecture-intelligence-evidence-graph-vocabulary";

describe("ArchitectureIntelligenceEvidenceGraphVocabularyRail (TB-2273)", () => {
  it("renders architecture-intelligence strip with peer link to evidence graph", () => {
    render(
      <ArchitectureIntelligenceEvidenceGraphVocabularyRail currentSurfaceId="architecture-intelligence" />,
    );

    const strip = screen.getByTestId("architecture-intelligence-evidence-graph-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "architecture-intelligence");
    expect(strip.textContent ?? "").toContain(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE);

    const peer = screen.getByTestId(
      "architecture-intelligence-evidence-graph-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK.label);
    expect(peer).toHaveAttribute("href", ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK.href);
  });

  it("renders evidence-graph strip with peer link to architecture intelligence", () => {
    render(
      <ArchitectureIntelligenceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />,
    );

    expect(screen.getByTestId("architecture-intelligence-evidence-graph-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "evidence-graph",
    );

    const peer = screen.getByTestId(
      "architecture-intelligence-evidence-graph-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(
      ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK.label,
    );
    expect(peer).toHaveAttribute(
      "href",
      ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK.href,
    );
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ArchitectureIntelligenceEvidenceGraphVocabularyRail
        currentSurfaceId="architecture-intelligence"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("architecture-intelligence-evidence-graph-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("architecture-intelligence-evidence-graph-vocabulary-current"),
    ).toHaveTextContent(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK.label);
  });
});
