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

    expect(screen.getByText("1 / 3 stages")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
