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
      hardCitationCount: 0,
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
      hardCitationCount: 0,
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
    provenanceQueryMock.data = {
      baseline: {
        runId: "run-left",
        trail: {
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "data-residency", tier: "Must" }],
        },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
        hardCitationCount: 0,
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
        hardCitationCount: 0,
      },
    };
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
        hardCitationCount: 0,
      },
      target: {
        runId: "run-right",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "SoftInfeasible",
        hardCitationCount: 0,
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

  it("renders hard citation delta when counts differ (LN-037)", () => {
    workspaceModeMock.isWorkingMode = true;
    provenanceQueryMock.data = {
      baseline: {
        runId: "run-left",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "HardInfeasible",
        hardCitationCount: 0,
      },
      target: {
        runId: "run-right",
        trail: { asserted: [], inferred: [], skipped: [] },
        missingTrailDefect: false,
        feasibilityVerdictKind: "HardInfeasible",
        hardCitationCount: 2,
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

    expect(screen.getByTestId("compare-hard-citation-delta")).toBeInTheDocument();
    expect(screen.getByText(/Hard citation delta/i)).toBeInTheDocument();
  });

  it("renders compact provenance band in Guided mode when skipped MUST counts differ", () => {
    workspaceModeMock.isWorkingMode = false;
    provenanceQueryMock.data = {
      baseline: {
        runId: "run-left",
        trail: {
          asserted: [],
          inferred: [],
          skipped: [{ questionKey: "data-residency", tier: "Must" }],
        },
        missingTrailDefect: false,
        feasibilityVerdictKind: "Feasible",
        hardCitationCount: 0,
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
        hardCitationCount: 0,
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

    expect(screen.getByTestId("compare-provenance-delta-band")).toBeInTheDocument();
    expect(screen.getByText(/Assumption and provenance delta/i)).toBeInTheDocument();
    expect(screen.getByText(/skipped MUST 1/i)).toBeInTheDocument();
    expect(screen.queryByTestId("transparency-trail-skipped-must")).not.toBeInTheDocument();
  });
});
