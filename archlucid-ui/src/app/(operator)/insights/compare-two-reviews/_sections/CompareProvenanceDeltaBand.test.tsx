import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: true,
}));

const provenanceQueryMock = vi.hoisted(() => ({
  data: {
    baseline: {
      runId: "run-left",
      trail: {
        asserted: [],
        inferred: [],
        skipped: [{ questionKey: "data-residency", tier: "Must" }],
      },
      missingTrailDefect: false,
    },
    target: {
      runId: "run-right",
      trail: {
        asserted: [],
        inferred: [],
        skipped: [],
      },
      missingTrailDefect: false,
    },
  } as const,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-compare-provenance-trails-query", () => ({
  useCompareProvenanceTrailsQuery: () => provenanceQueryMock,
}));

import { CompareProvenanceDeltaBand } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareProvenanceDeltaBand";

describe("CompareProvenanceDeltaBand (WA-09)", () => {
  it("renders provenance band in Working mode when skipped MUST counts differ", () => {
    workspaceModeMock.isWorkingMode = true;

    render(
      <CompareProvenanceDeltaBand
        baselineRunId="run-left"
        targetRunId="run-right"
        baselinePickedSummary={null}
        targetPickedSummary={null}
      />,
    );

    expect(screen.getByTestId("compare-provenance-delta-band")).toBeInTheDocument();
    expect(screen.getByText(/Assumption and provenance delta/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("transparency-trail-skipped-must")).toHaveLength(1);
  });

  it("renders nothing in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    const { container } = render(
      <CompareProvenanceDeltaBand
        baselineRunId="run-left"
        targetRunId="run-right"
        baselinePickedSummary={null}
        targetPickedSummary={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
