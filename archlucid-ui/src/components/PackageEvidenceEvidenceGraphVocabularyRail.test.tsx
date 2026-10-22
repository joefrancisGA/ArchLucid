import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import {
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK,
  PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO,
  buildPackageEvidenceEvidenceGraphVocabulary,
} from "@/lib/vocabulary/package-evidence-evidence-graph-vocabulary";

describe("PackageEvidenceEvidenceGraphVocabularyRail (TB-2300)", () => {
  it("renders package-evidence strip with peer link to evidence graph", () => {
    const model = buildPackageEvidenceEvidenceGraphVocabulary("run-abc");

    render(
      <PackageEvidenceEvidenceGraphVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-evidence"
      />,
    );

    const strip = screen.getByTestId("package-evidence-evidence-graph-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "package-evidence");
    expect(strip.textContent ?? "").toContain(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE);

    const peer = screen.getByTestId("package-evidence-evidence-graph-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK.label);
    expect(peer).toHaveAttribute("href", model.evidenceGraphLink.href);
  });

  it("renders evidence-graph strip with Reviews Evidence peer", () => {
    render(
      <PackageEvidenceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />,
    );

    const peer = screen.getByTestId("package-evidence-evidence-graph-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK.label);
    expect(peer).toHaveAttribute("href", PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PackageEvidenceEvidenceGraphVocabularyRail
        runId="run-abc"
        currentSurfaceId="package-evidence"
        variant="full"
      />,
    );

    expect(screen.getByText(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO)).toBeInTheDocument();
  });
});
