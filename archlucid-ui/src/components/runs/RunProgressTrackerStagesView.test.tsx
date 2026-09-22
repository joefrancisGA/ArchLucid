import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunProgressTrackerStagesView } from "@/components/runs/RunProgressTrackerStagesView";

describe("RunProgressTrackerStagesView (WA-22)", () => {
  it("shows discrete stage counts without a determinate progress bar", () => {
    render(
      <RunProgressTrackerStagesView
        buyerAssessmentCopy={true}
        pipelineJobLabel={{
          heading: "Assessment progress",
          progressAriaLabel: "Assessment progress",
          stageSummaryNoun: "assessment",
        }}
        completedStages={1}
        totalProgressStages={3}
        ctx={true}
        graph={false}
        findings={false}
        manifest={false}
        stageTimeline={[]}
        activeSummary={null}
      />,
    );

    const progressLine = screen.getByTestId("run-progress-stage-count");
    expect(progressLine).toHaveTextContent("Progress: 1 / 3 stages");
    expect(progressLine).not.toHaveClass("justify-between");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("marks the first incomplete stage as the terminal failure boundary", () => {
    render(
      <RunProgressTrackerStagesView
        buyerAssessmentCopy={true}
        pipelineJobLabel={{
          heading: "Assessment progress",
          progressAriaLabel: "Assessment progress",
          stageSummaryNoun: "assessment",
        }}
        completedStages={0}
        totalProgressStages={3}
        ctx={false}
        graph={false}
        findings={false}
        manifest={false}
        stageTimeline={[]}
        activeSummary={null}
        pipelineTerminalFailure={true}
      />,
    );

    expect(screen.getAllByText("Stopped here")).toHaveLength(1);
    expect(screen.getAllByText("Did not run")).toHaveLength(3);
  });

  it("can suppress the progress count line when live status already states stage progress", () => {
    render(
      <RunProgressTrackerStagesView
        buyerAssessmentCopy={true}
        pipelineJobLabel={{
          heading: "Assessment progress",
          progressAriaLabel: "Assessment progress",
          stageSummaryNoun: "assessment",
        }}
        completedStages={0}
        totalProgressStages={3}
        ctx={false}
        graph={false}
        findings={false}
        manifest={false}
        stageTimeline={[]}
        activeSummary={null}
        suppressStageCountLine={true}
      />,
    );

    expect(screen.queryByTestId("run-progress-stage-count")).toBeNull();
  });

  it("uses rehearsal step labels and pending copy when career honesty applies (CG-032)", () => {
    render(
      <RunProgressTrackerStagesView
        buyerAssessmentCopy={true}
        pipelineJobLabel={{
          heading: "Assessment progress",
          progressAriaLabel: "Assessment progress",
          stageSummaryNoun: "assessment",
        }}
        completedStages={3}
        totalProgressStages={3}
        ctx={true}
        graph={true}
        findings={true}
        manifest={false}
        stageTimeline={[]}
        activeSummary={null}
        careerHonestyPresentation={{
          cellId: "career-simulator-blocked",
          terminalLiveStatus: "blocked",
          signedRecordStepLabel: "Career seal blocked",
          signedRecordPendingLabel: "Sealed record blocked",
          findingsStepLabel: "Findings ready (rehearsal)",
          completeStageStatusLabel: "Rehearsal complete",
          completeStageStatusKind: "needs-attention",
        }}
      />,
    );

    expect(screen.getByText("Findings ready (rehearsal)")).toBeInTheDocument();
    expect(screen.getByText("Career seal blocked")).toBeInTheDocument();
    expect(screen.getByTestId("run-progress-signed-record-row")).toHaveTextContent("Sealed record blocked");
    expect(screen.getAllByText("Rehearsal complete")).toHaveLength(3);
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
  });
});
