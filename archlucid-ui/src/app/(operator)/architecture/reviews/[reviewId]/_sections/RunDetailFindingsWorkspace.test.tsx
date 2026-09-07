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
  usePathname: () => "/architecture/reviews/run-1",
}));

vi.mock("@/components/QuickDecisionSummary", () => ({
  QuickDecisionSummary: () => <div data-testid="quick-decision-summary-stub" />,
}));

vi.mock("@/components/findings/RunDetailFindingsCardViewLazy", () => ({
  RunDetailFindingsCardViewLazy: () => <div data-testid="quick-decision-summary-stub" />,
}));

vi.mock("@/components/findings/RunDetailFindingsDenseTable", () => ({
  RunDetailFindingsDenseTable: () => <div data-testid="run-detail-findings-dense-table-stub" />,
}));

vi.mock("@/components/findings/FindingsItsmExportToolbar", () => ({
  FindingsItsmExportToolbar: () => null,
}));

const architectWorkspaceChromeMocks = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => architectWorkspaceChromeMocks.enabled,
}));

const simulatorNoticeMocks = vi.hoisted(() => ({
  isSimulator: false,
}));

vi.mock("@/components/usability/SimulatorModeAiOperationNotice", () => ({
  SimulatorModeAiOperationNotice: (props: { testId?: string }) =>
    simulatorNoticeMocks.isSimulator ? (
      <div data-testid={props.testId ?? "simulator-mode-ai-operation-notice"}>Simulator notice</div>
    ) : null,
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
    simulatorNoticeMocks.isSimulator = false;
    architectWorkspaceChromeMocks.enabled = false;
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

    fireEvent.click(screen.getByTestId("finding-job-view-more-toggle"));
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

  it("shows hidden-filter honesty with Show all when filters hide rows", () => {
    architectWorkspaceChromeMocks.enabled = true;
    const findings: QuickDecisionFinding[] = [
      ...Array.from({ length: 10 }, (_, index) =>
        finding({
          findingId: `f-visible-${index}`,
          severityValue: 1,
          findingOrder: index,
          insightDensityScore: 80,
        }),
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        finding({
          findingId: `f-hidden-${index}`,
          severityValue: 1,
          findingOrder: 10 + index,
          insightDensityScore: 10,
          classification: "ChecklistCoverage",
        }),
      ),
    ];

    render(<RunDetailFindingsWorkspace runId="run-1" findings={findings} packageCommitted={true} />);

    expect(screen.getByTestId("findings-hidden-filter-honesty-band")).toHaveTextContent(
      "3 findings hidden by filters",
    );
    fireEvent.click(screen.getByTestId("findings-hidden-filter-show-all"));
    expect(screen.queryByTestId("findings-hidden-filter-honesty-band")).not.toBeInTheDocument();
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

  it("shows simulator rehearsal notice on the findings workspace when mode is simulator", () => {
    simulatorNoticeMocks.isSimulator = true;

    render(<RunDetailFindingsWorkspace runId="run-1" findings={[]} />);

    expect(screen.getByTestId("run-detail-findings-simulator-notice")).toBeInTheDocument();
  });

  it("shows actor-engine quiet hint in the toolbar hero when analysis is complete and graph has no actors", () => {
    architectWorkspaceChromeMocks.enabled = true;

    render(
      <RunDetailFindingsWorkspace
        runId="run-1"
        findings={[]}
        analysisStagesComplete={true}
        graphSnapshot={{ nodes: [{ nodeType: "service" }] }}
        packageCommitted={true}
      />,
    );

    const hero = screen.getByTestId("run-detail-findings-toolbar-hero");
    expect(hero).toContainElement(screen.getByTestId("run-detail-actor-engines-quiet-hint"));
    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toHaveTextContent(
      "did not run",
    );
  });

  it("shows density desk honesty line and classification bands in Working mode", () => {
    architectWorkspaceChromeMocks.enabled = true;

    render(
      <RunDetailFindingsWorkspace
        runId="run-1"
        findings={[
          finding({
            findingId: "f-1",
            insightDensityScore: 20,
            classification: "ChecklistCoverage",
          }),
        ]}
        packageCommitted={true}
      />,
    );

    expect(screen.getByTestId("run-detail-findings-density-desk-controls")).toHaveTextContent(
      "insight-density gate demotes",
    );
    expect(screen.getByTestId("run-detail-findings-band-decision-grade")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-band-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-findings-checklist-remains-hint")).toBeInTheDocument();
  });

  it("hides actor-engine quiet hint when actor nodes exist", () => {
    render(
      <RunDetailFindingsWorkspace
        runId="run-1"
        findings={[]}
        analysisStagesComplete={true}
        graphSnapshot={{ nodes: [{ nodeType: "Actor" }] }}
      />,
    );

    expect(screen.queryByTestId("run-detail-actor-engines-quiet-hint")).not.toBeInTheDocument();
  });
});
