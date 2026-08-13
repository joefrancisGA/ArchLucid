import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OverviewDiagramVocabularyRail } from "@/components/OverviewDiagramVocabularyRail";
import {
  OVERVIEW_DIAGRAM_COMPACT_LINE,
  OVERVIEW_DIAGRAM_HEADING,
  OVERVIEW_DIAGRAM_WHY_TWO,
  buildOverviewDiagramVocabulary,
} from "@/lib/vocabulary/overview-diagram-vocabulary";

describe("OverviewDiagramVocabularyRail (TB-2309)", () => {
  it("renders overview strip with peer link to diagram", () => {
    const model = buildOverviewDiagramVocabulary("run-abc");

    render(
      <OverviewDiagramVocabularyRail runId="run-abc" currentSurfaceId="overview" />,
    );

    const strip = screen.getByTestId("overview-diagram-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "overview");
    expect(strip.textContent ?? "").toContain(OVERVIEW_DIAGRAM_COMPACT_LINE);

    const peer = screen.getByTestId("overview-diagram-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.diagramLink.label);
    expect(peer).toHaveAttribute("href", model.diagramLink.href);
  });

  it("renders diagram strip with peer link to overview", () => {
    const model = buildOverviewDiagramVocabulary("run-abc");

    render(<OverviewDiagramVocabularyRail runId="run-abc" currentSurfaceId="diagram" />);

    const peer = screen.getByTestId("overview-diagram-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.overviewLink.label);
    expect(peer).toHaveAttribute("href", model.overviewLink.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <OverviewDiagramVocabularyRail
        runId="run-abc"
        currentSurfaceId="overview"
        variant="full"
      />,
    );

    expect(screen.getByText(OVERVIEW_DIAGRAM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_DIAGRAM_WHY_TWO)).toBeInTheDocument();
  });
});
