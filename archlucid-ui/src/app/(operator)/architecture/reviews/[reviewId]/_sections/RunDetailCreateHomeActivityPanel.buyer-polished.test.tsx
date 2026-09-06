import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailProgressTrackerDeferred: () => <div data-testid="progress-tracker" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { RunDetailCreateHomeActivityPanel } from "./RunDetailCreateHomeActivityPanel";
import { ARCHITECTURE_CREATED_ACTIVITY_SKIP_TARGET_ID } from "@/lib/architecture/architecture-created-activity-page-copy";
import {
  RUN_DETAIL_CREATE_HOME_ACTIVITY_BUYER_START_HERE_HELPER,
  RUN_DETAIL_CREATE_HOME_ACTIVITY_PAGE_LEAD,
} from "@/lib/runs/run-detail-activity-sources";

const baseProps = {
  runId: "run-abc",
  routeRunId: "run-abc",
  manifestId: null,
  showProgressTracker: false,
  statusLine: "Assessment has not started yet.",
  provenanceAsOfLabel: " — ",
  preFinalizeReadyToFinalize: false,
  progressForPipelineUi: { runId: "run-abc", description: "Claims intake" },
  outcomeCards: <div data-testid="outcome-cards">Outcome</div>,
  midDeferred: <div data-testid="mid-deferred">Mid</div>,
  sourcesPanel: <div data-testid="sources-panel">Sources</div>,
};

describe("RunDetailCreateHomeActivityPanel buyer-polished shell (REA)", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
  });

  it("renders first-viewport intro, hides operator chrome, and omits inline technical detail", () => {
    render(<RunDetailCreateHomeActivityPanel {...baseProps} />);

    expect(screen.getByTestId(ARCHITECTURE_CREATED_ACTIVITY_SKIP_TARGET_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-activity-intro")).toHaveTextContent(
      RUN_DETAIL_CREATE_HOME_ACTIVITY_PAGE_LEAD,
    );
    expect(screen.getByTestId("architecture-activity-buyer-start-here-helper")).toHaveTextContent(
      RUN_DETAIL_CREATE_HOME_ACTIVITY_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByTestId("run-detail-activity-status-headline")).toHaveTextContent(
      "Assessment has not started yet.",
    );
    expect(screen.queryByTestId("architecture-activity-orientation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-provenance-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-activity-technical-detail")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sources-panel")).not.toBeInTheDocument();
  });

  it("keeps progress tracker and failure card visible in buyer-polished shell", () => {
    render(
      <RunDetailCreateHomeActivityPanel
        {...baseProps}
        showProgressTracker
        lastFailureSummary={{
          agentType: "HolisticCritic",
          failureClass: "parse",
          reasonCode: "SchemaViolation",
        }}
        legacyRunStatus="Failed"
        failureRecordedAtUtc="2026-09-01T12:00:00.000Z"
      />,
    );

    expect(screen.getByTestId("progress-tracker")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-last-failure-card")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-activity-technical-detail")).not.toBeInTheDocument();
  });
});
