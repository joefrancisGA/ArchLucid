import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunProvenanceEvidenceGraphVocabularyRail } from "@/components/runs/RunProvenanceEvidenceGraphVocabularyRail";
import {
  RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE,
  RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK,
  RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING,
  RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK,
  RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO,
} from "@/lib/vocabulary/run-provenance-evidence-graph-vocabulary";

describe("RunProvenanceEvidenceGraphVocabularyRail (TB-2296)", () => {
  it("renders run-provenance strip with peer link to evidence graph", () => {
    render(<RunProvenanceEvidenceGraphVocabularyRail currentSurfaceId="run-provenance" />);

    const strip = screen.getByTestId("run-provenance-evidence-graph-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "run-provenance");
    expect(strip.textContent ?? "").toContain(RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE);

    const peer = screen.getByTestId("run-provenance-evidence-graph-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK.label);
    expect(peer).toHaveAttribute("href", RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK.href);
  });

  it("renders evidence-graph strip with peer link toward reviews/provenance", () => {
    render(<RunProvenanceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />);

    const peer = screen.getByTestId("run-provenance-evidence-graph-vocabulary-peer-link");
    expect(peer).toHaveTextContent(RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK.label);
    expect(peer).toHaveAttribute("href", RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <RunProvenanceEvidenceGraphVocabularyRail currentSurfaceId="run-provenance" variant="full" />,
    );

    expect(screen.getByText(RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO)).toBeInTheDocument();
  });
});
