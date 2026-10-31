import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunAgentQualityWarningsPanel } from "@/components/runs/RunAgentQualityWarningsPanel";

describe("RunAgentQualityWarningsPanel", () => {
  it("uses status tags and Not rejected for warned rows", () => {
    render(
      <RunAgentQualityWarningsPanel
        runId="run-quality"
        rows={[
          {
            traceId: "t-warn",
            agentType: "planner",
            agentLabel: "Planner",
            status: "warned",
            structuralCompletenessRatio: 0.8,
            semanticScore: null,
            faithfulnessScore: null,
            rejectReasonCategory: null,
            rejectReasonLabel: null,
            breachedThresholds: [],
          },
          {
            traceId: "t-reject",
            agentType: "writer",
            agentLabel: "Writer",
            status: "rejected",
            structuralCompletenessRatio: 0.2,
            semanticScore: 0.1,
            faithfulnessScore: 0.1,
            rejectReasonCategory: "semantic",
            rejectReasonLabel: null,
            breachedThresholds: ["semantic"],
          },
        ]}
      />,
    );

    expect(screen.queryByText(/Critical/i)).not.toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Not rejected.")).toBeInTheDocument();
    expect(screen.getByText("Reject reason was not returned")).toBeInTheDocument();
  });
});
