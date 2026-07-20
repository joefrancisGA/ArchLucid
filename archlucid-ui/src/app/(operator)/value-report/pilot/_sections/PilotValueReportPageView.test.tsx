import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotValueReportPageView } from "./PilotValueReportPageView";
import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => <div data-testid="layer-header" />,
}));

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/pilots/PilotRoiValidationHandoffCard", () => ({
  PilotRoiValidationHandoffClient: () => null,
}));

function buildModel(overrides: Partial<PilotValueReportPilotPageViewModel> = {}): PilotValueReportPilotPageViewModel {
  return {
    fromUtc: "2026-03-01T00:00",
    setFromUtc: vi.fn(),
    toUtc: "2026-04-01T00:00",
    setToUtc: vi.fn(),
    periodPreset: "last-30",
    setPeriodPreset: vi.fn(),
    applyPeriodPreset: vi.fn(),
    data: null,
    busy: false,
    exportBusy: false,
    emailBusy: false,
    error: null,
    load: vi.fn(),
    onDownloadReport: vi.fn(),
    emailPreviewOpen: false,
    emailPreview: null,
    openEmailPreview: vi.fn(),
    closeEmailPreview: vi.fn(),
    confirmSendEmail: vi.fn(),
    includesSampleData: false,
    reportingTimezoneLabel: "UTC",
    ...overrides,
  };
}

describe("PilotValueReportPageView", () => {
  it("renders pilot outcomes title and reporting period controls", () => {
    render(<PilotValueReportPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: "Pilot outcomes" })).toBeInTheDocument();
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply period" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download report" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send sponsor report" })).toBeInTheDocument();
  });

  it("shows explicit empty state when no finalized reviews exist", () => {
    render(
      <PilotValueReportPageView
        model={buildModel({
          data: {
            tenantId: "tenant-1",
            fromUtc: "2026-03-01T00:00:00.000Z",
            toUtc: "2026-04-01T00:00:00.000Z",
            totalRunsCommitted: 0,
            runDetailsTruncated: false,
            runDetailCap: 50,
            totalFindings: 0,
            findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
            totalRecommendationsProduced: 0,
            averagePipelineCompletionSeconds: null,
            governanceApprovals: 0,
            governanceRejections: 0,
            policyPackAssignments: 0,
            comparisonOrDriftDetections: 0,
            uniqueAgentTypes: [],
            committedRunsTimeline: [],
            governancePendingApprovalsNow: 0,
            auditExportTruncated: false,
          },
        })}
      />,
    );

    expect(screen.getByTestId("pilot-outcomes-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No finalized reviews in this reporting period")).toBeInTheDocument();
    expect(screen.queryByText("Severity distribution")).not.toBeInTheDocument();
  });

  it("renders populated pilot summary when finalized reviews exist", () => {
    render(
      <PilotValueReportPageView
        model={buildModel({
          data: {
            tenantId: "tenant-1",
            fromUtc: "2026-03-01T00:00:00.000Z",
            toUtc: "2026-04-01T00:00:00.000Z",
            totalRunsCommitted: 2,
            runDetailsTruncated: false,
            runDetailCap: 50,
            totalFindings: 3,
            findingsBySeverity: { critical: 1, high: 1, medium: 1, low: 0, info: 0 },
            totalRecommendationsProduced: 2,
            averagePipelineCompletionSeconds: 90,
            governanceApprovals: 1,
            governanceRejections: 0,
            policyPackAssignments: 1,
            comparisonOrDriftDetections: 0,
            uniqueAgentTypes: ["ArchitectureReviewer"],
            committedRunsTimeline: [
              {
                runId: "run-1",
                createdUtc: "2026-03-10T08:00:00.000Z",
                committedUtc: "2026-03-11T08:00:00.000Z",
                systemName: "Claims Intake",
              },
            ],
            governancePendingApprovalsNow: 0,
            auditExportTruncated: false,
          },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Pilot summary" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Finalized reviews" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download report" })).toBeEnabled();
    expect(screen.queryByTestId("pilot-outcomes-empty-state")).not.toBeInTheDocument();
  });
});
