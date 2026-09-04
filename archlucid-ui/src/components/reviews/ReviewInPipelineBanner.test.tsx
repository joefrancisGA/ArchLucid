import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";
import { ReviewInPipelineBanner } from "@/components/reviews/ReviewInPipelineBanner";
import type { RunSummary } from "@/types/authority";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams("reviewTab=findings"),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: "guided",
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-review-workbench-shortcuts", () => ({
  useReviewWorkbenchShortcuts: vi.fn(),
}));

const inPipelineSummary: RunSummary = {
  runId: "run-abc",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: true,
  hasFindingsSnapshot: false,
  hasGoldenManifest: false,
};

describe("ReviewInPipelineBanner (TB-2385)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    replaceMock.mockClear();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=findings");
  });

  it("renders stage label and activity CTA when pipeline incomplete", () => {
    render(<ReviewInPipelineBanner runId="run-abc" initialSummary={inPipelineSummary} />);

    expect(screen.getByTestId("review-in-pipeline-banner")).toBeInTheDocument();
    expect(screen.getByTestId("review-in-pipeline-status-tag")).toHaveTextContent("In progress");
    expect(screen.getByText(/in progress:/i)).toHaveClass("font-semibold");
    expect(screen.getByTestId("review-in-pipeline-banner-activity-cta")).toHaveTextContent("View activity");
  });

  it("returns null when the review already failed", () => {
    const { container } = render(
      <ReviewInPipelineBanner
        runId="run-abc"
        initialSummary={inPipelineSummary}
        diagnosticContext={{ legacyRunStatus: "Failed" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when summary shows pipeline complete", () => {
    const { container } = render(
      <ReviewInPipelineBanner
        runId="run-abc"
        initialSummary={{
          ...inPipelineSummary,
          hasFindingsSnapshot: true,
          hasGoldenManifest: true,
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("ReviewDetailWorkspace in-pipeline banner (TB-2385)", () => {
  const panels = {
    overview: <div data-testid="panel-overview">Overview</div>,
    findings: <div data-testid="panel-findings">Findings panel</div>,
    evidence: <div>Evidence</div>,
    policies: <div>Policies</div>,
    decisionsRemediation: <div>Decisions</div>,
    reviewPackage: <div>Package</div>,
    architecture: <div>Architecture</div>,
    activity: <div data-testid="panel-activity">Activity</div>,
  };

  it("shows banner on findings tab but not activity when provided", () => {
    render(
      <ReviewDetailWorkspace
        runId="run-abc"
        panels={panels}
        inPipelineBanner={<ReviewInPipelineBanner runId="run-abc" initialSummary={inPipelineSummary} />}
      />,
    );

    expect(
      within(screen.getByTestId("review-detail-workspace-panel-findings")).getByTestId(
        "review-in-pipeline-banner",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("panel-findings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Activity/i }));

    expect(
      within(screen.getByTestId("review-detail-workspace-panel-activity")).queryByTestId(
        "review-in-pipeline-banner",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("panel-activity")).toBeInTheDocument();
  });

  it("does not warn when in-pipeline banner and overview panel are keyed siblings", () => {
    const keyWarnings: string[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      const message = args.map((arg) => String(arg)).join(" ");

      if (message.includes('Each child in a list should have a unique "key" prop')) {
        keyWarnings.push(message);
      }
    });

    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");

    render(
      <ReviewDetailWorkspace
        runId="run-abc"
        panels={{
          ...panels,
          overview: (
            <div key="review-detail-overview-panel" className="space-y-4" data-testid="panel-overview">
              Overview
            </div>
          ),
        }}
        inPipelineBanner={<ReviewInPipelineBanner runId="run-abc" initialSummary={inPipelineSummary} />}
      />,
    );

    expect(keyWarnings).toEqual([]);
    consoleError.mockRestore();
  });
});
