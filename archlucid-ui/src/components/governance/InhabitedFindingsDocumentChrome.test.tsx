import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" as const }),
}));

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: () => ({ data: undefined }),
}));

vi.mock("@/lib/fetch-run-detail-page-bundle-client", () => ({
  fetchRunDetailCriticalPageBundle: vi.fn(),
}));

vi.mock("@/components/architecture/WorkingInstrumentDocumentTitle", () => ({
  WorkingInstrumentDocumentTitle: () => <div data-testid="working-instrument-document-title" />,
}));

vi.mock("@/components/governance/InhabitedFindingsWorkLeaseHonesty", () => ({
  InhabitedFindingsWorkLeaseHonesty: () => null,
}));

vi.mock("@/components/governance/InhabitedFindingsRoomCard", () => ({
  InhabitedFindingsRoomCard: () => null,
}));

vi.mock("@/components/governance/InhabitedFindingsExplorationStrip", () => ({
  InhabitedFindingsExplorationStrip: () => null,
}));

vi.mock("@/components/governance/InhabitedFindingsAssumptionDeltaEntry", () => ({
  InhabitedFindingsAssumptionDeltaEntry: () => null,
}));

vi.mock("@/components/feasibility/TransparencyTrailPanel", () => ({
  TransparencyTrailPanel: () => <div data-testid="transparency-trail-panel" />,
}));

vi.mock("@/app/(operator)/governance/findings/GovernanceFindingsQueueQuietEnginesHint", () => ({
  GovernanceFindingsQueueQuietEnginesHint: () => null,
}));

vi.mock("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailInfeasibleDecisionLead", () => ({
  RunDetailInfeasibleDecisionLead: () => <div data-testid="run-detail-infeasible-decision-lead" />,
}));

vi.mock("@/components/reviews/RunDetailInsightDensityMeasurementDenominatorStrip", () => ({
  RunDetailInsightDensityMeasurementDenominatorStrip: () => null,
}));

vi.mock("@/components/architecture/ArchitectureIdentityDeskReviewFinalizeAction", () => ({
  ArchitectureIdentityDeskReviewFinalizeAction: () => null,
}));

import { InhabitedFindingsDocumentChrome } from "@/components/governance/InhabitedFindingsDocumentChrome";

const ARCHITECTURE_ID = "architecture-identity-001";

function renderWithQuery(ui: React.ReactElement): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("InhabitedFindingsDocumentChrome (IP-011)", () => {
  it("renders transparency trail and infeasible package on first paint when server bundle is provided", () => {
    renderWithQuery(
      <InhabitedFindingsDocumentChrome
        workingMode={true}
        pathname={architectureNestedFindingsPath(ARCHITECTURE_ID)}
        scopedArchitectureId={ARCHITECTURE_ID}
        architectureDisplayName="Payments platform"
        scopedRunId="run-a"
        scopedRunTitle="September review"
        initialTrailBundle={{
          runId: "run-a",
          trail: {
            asserted: [{ key: "reason", value: "Budget gap" }],
            inferred: [],
            skipped: [],
          },
          feasibilityVerdict: {
            decision: "Infeasible",
            transparencyTrail: {
              asserted: [{ key: "reason", value: "Budget gap" }],
              inferred: [],
              skipped: [],
            },
          },
          enginesSucceeded: 2,
          runCompleted: true,
        }}
      />,
    );

    expect(screen.getByTestId("inhabited-findings-transparency-trail")).toBeInTheDocument();
    expect(screen.getByTestId("inhabited-findings-infeasible-package")).toBeInTheDocument();
    expect(screen.getByTestId("transparency-trail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-infeasible-decision-lead")).toBeInTheDocument();
  });
});
