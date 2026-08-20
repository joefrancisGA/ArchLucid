import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailCreateHomeActivityPanel } from "./RunDetailCreateHomeActivityPanel";

vi.mock("./run-detail-page-view-deferred-chunks", () => ({
  RunDetailProgressTrackerDeferred: () => <div data-testid="progress-tracker" />,
}));

const baseProps = {
  runId: "run-abc",
  routeRunId: "run-abc",
  manifestId: null,
  showProgressTracker: false,
  statusLine: "Assessment has not started yet.",
  provenanceAsOfLabel: "—",
  preFinalizeReadyToFinalize: false,
  progressForPipelineUi: { runId: "run-abc", description: "Claims intake" },
  outcomeCards: <div data-testid="outcome-cards">Outcome</div>,
  midDeferred: <div data-testid="mid-deferred">Mid</div>,
  sourcesPanel: <div data-testid="sources-panel">Sources</div>,
};

describe("RunDetailCreateHomeActivityPanel", () => {
  it("shows orientation and a single primary region when the progress tracker is absent (TB-1832)", () => {
    render(<RunDetailCreateHomeActivityPanel {...baseProps} />);

    expect(screen.getByTestId("architecture-activity-primary-region")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-activity-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-activity-status-headline")).toHaveTextContent(
      "Assessment has not started yet.",
    );
    expect(screen.queryByTestId("progress-tracker")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open overview" })).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=overview"),
    );
  });

  it("mounts the progress tracker in the primary region and defers forensics (TB-1834)", () => {
    render(<RunDetailCreateHomeActivityPanel {...baseProps} showProgressTracker />);

    expect(screen.getByTestId("progress-tracker")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-activity-technical-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-activity-orientation")).not.toBeInTheDocument();
    expect(screen.getByTestId("outcome-cards").closest("details")).not.toBeNull();
  });
});
