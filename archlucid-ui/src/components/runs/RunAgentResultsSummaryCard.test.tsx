import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunAgentResultsSummaryCard } from "@/components/runs/RunAgentResultsSummaryCard";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: (): { refresh: () => void } => ({ refresh: (): void => {} }),
  };
});

describe("RunAgentResultsSummaryCard", () => {
  it("renders agent result summaries when results are present", () => {
    render(
      <RunAgentResultsSummaryCard
        results={[
          {
            resultId: "result-1",
            taskId: "task-1",
            runId: "run-1",
            agentType: "Topology",
            claims: ["Claim A"],
            evidenceRefs: ["evidence-1", "evidence-2"],
            findings: [{ findingId: "f-1" }],
            confidence: 0.82,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("run-agent-results-summary-card")).toBeInTheDocument();
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("Architecture structure");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("1 claim");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("1 finding");
    expect(screen.getByTestId("run-agent-result-row-result-1")).toHaveTextContent("2 evidence refs");
  });

  it("prefers outcome matrix when agentExecutionOutcomes are present (TB-937)", () => {
    render(
      <RunAgentResultsSummaryCard
        results={[
          {
            resultId: "result-1",
            taskId: "task-1",
            runId: "run-1",
            agentType: "Topology",
            claims: ["Claim A"],
          },
        ]}
        agentExecutionOutcomes={[
          { agentType: "Topology", outcome: "Succeeded" },
          { agentType: "Cost", outcome: "Missing" },
        ]}
        runId="run-1"
      />,
    );

    expect(screen.getByTestId("run-agent-execution-outcomes")).toBeInTheDocument();
    expect(screen.getByTestId("run-agent-outcome-row-Cost")).toHaveTextContent("Missing");
    expect(screen.queryByTestId("run-agent-result-row-result-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("run-agent-retry-failed-button")).toBeInTheDocument();
  });

  it("returns null when results and outcomes are empty", () => {
    const { container } = render(<RunAgentResultsSummaryCard results={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
