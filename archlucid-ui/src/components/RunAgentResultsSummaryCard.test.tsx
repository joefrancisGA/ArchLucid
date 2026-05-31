import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunAgentResultsSummaryCard } from "@/components/RunAgentResultsSummaryCard";

describe("RunAgentResultsSummaryCard", () => {
  it("renders agent result summaries when results are present", () => {
    render(
      <RunAgentResultsSummaryCard
        results={[
          {
            resultId: "result-1",
            taskId: "task-1",
            runId: "run-1",
            agentType: 1,
            claims: ["Claim A"],
            evidenceRefs: ["evidence-1", "evidence-2"],
            findings: [{ findingId: "f-1" }],
            confidence: 0.82,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("run-agent-results-summary-card")).toBeInTheDocument();
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("Topology");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("1 claim");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("1 finding");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("2 evidence refs");
  });

  it("returns null when results are empty", () => {
    const { container } = render(<RunAgentResultsSummaryCard results={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
