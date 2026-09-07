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
      feasibilityVerdictKind: "Feasible",
    },
    target: {
      runId: "run-right",
      trail: {
        asserted: [],
        inferred: [],
        skipped: [],
      },
      missingTrailDefect: false,
      feasibilityVerdictKind: "Feasible",
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
    expect(screen.getAllByTestId("transparency-trail-skipped-must")).toHaveLength(2);
  });

  it("renders feasibility verdict delta when kinds differ (FC-34)", () => {
    workspaceModeMock.isWorkingMode = true;
    provenanceQueryMock.data = {
      baseline: {
        runId: "run-left",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
      },
      target: {
        runId: "run-right",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "SoftInfeasible",
      },
    };

    render(
      <CompareProvenanceDeltaBand
        baselineRunId="run-left"
        targetRunId="run-right"
        baselinePickedSummary={null}
        targetPickedSummary={null}
      />,
    );

    expect(screen.getByTestId("compare-feasibility-verdict-delta")).toBeInTheDocument();
    expect(screen.getByText(/Feasibility verdict changed/i)).toBeInTheDocument();
  });

  it("renders compact provenance band in Guided mode when skipped MUST counts differ", () => {
    workspaceModeMock.isWorkingMode = false;

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
    expect(screen.getByText(/skipped MUST 1/i)).toBeInTheDocument();
    expect(screen.queryByTestId("transparency-trail-skipped-must")).not.toBeInTheDocument();
  });
});
