import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigationMocks.searchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/QuickDecisionSummary", () => ({
  QuickDecisionSummary: () => <div data-testid="quick-decision-summary-stub" />,
}));

vi.mock("@/components/findings/FindingsItsmExportToolbar", () => ({
  FindingsItsmExportToolbar: () => null,
}));

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("RunDetailFindingsWorkspace", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams();
  });

  it("writes findingJobView to the url when the operator changes job view", () => {
    const replaceState = vi.fn();
    const originalHref = "http://localhost/architecture/reviews/run-1?reviewTab=findings";

    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("location", new URL(originalHref));

    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-1", severityValue: 1, findingOrder: 0 }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} />);

    fireEvent.click(screen.getByTestId("finding-job-view-verify-hypotheses"));

    expect(replaceState).toHaveBeenCalled();
    const nextUrl = String(replaceState.mock.calls[0]?.[2] ?? "");
    expect(nextUrl).toContain("findingJobView=verify-hypotheses");
  });

  it("keeps chip counts on the confidence-gated set when a severity filter is active", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
      finding({ findingId: "f-medium-2", severityValue: 1, findingOrder: 1 }),
      finding({ findingId: "f-high-1", severityValue: 2, findingOrder: 2 }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} />);

    fireEvent.click(screen.getByRole("button", { name: "Medium (2)" }));

    expect(screen.getByRole("button", { name: "All (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Medium (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "High (1)" })).toBeInTheDocument();
  });

  it("names the confidence gate in the visibility summary when rows are hidden", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
      finding({ findingId: "f-medium-2", severityValue: 1, findingOrder: 1 }),
      finding({
        findingId: "f-hidden-low",
        severityValue: 1,
        findingOrder: 2,
        confidenceLevel: "Low",
        enforcementTier: "Advisory",
      }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} />);

    expect(screen.getByTestId("run-detail-findings-visibility-summary")).toHaveTextContent(
      "Showing 2 of 3 — 1 hidden by confidence filter",
    );
  });

  it("renders create-home orientation strip and assessment metric without governance queue labels", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-medium-1", severityValue: 1, findingOrder: 0 }),
    ];

    render(
      <RunDetailFindingsWorkspace
        runId="run-1"
        findings={findings}
        packageCommitted={false}
        analysisStagesComplete={false}
        triageVisibleCount={1}
      />,
    );

    expect(screen.getByTestId("architecture-findings-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-assessment-metric")).toBeInTheDocument();
    expect(screen.queryByTestId("review-findings-secondary-view-strip")).not.toBeInTheDocument();
    expect(screen.queryByText(/Review package findings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/governance queue/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-toolbar")).toHaveAttribute("data-testid", "run-detail-findings-toolbar");
    expect(screen.getByTestId("quick-decision-summary-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("review-package-governance-findings-vocabulary"),
    ).not.toBeInTheDocument();
  });

  it("shows review vs workspace findings vocabulary rail on committed review findings tab", () => {
    const findings: QuickDecisionFinding[] = [
      finding({ findingId: "f-1", severityValue: 1, findingOrder: 0 }),
    ];

    render(<RunDetailFindingsWorkspace runId="run-abc" findings={findings} packageCommitted={true} />);

    expect(screen.getByTestId("review-package-governance-findings-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "review-package-findings",
    );
    expect(
      screen.getByTestId("review-package-governance-findings-vocabulary-peer-link"),
    ).toHaveAttribute("href", "/governance/findings?runId=run-abc");
  });
});
