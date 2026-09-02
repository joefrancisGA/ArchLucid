import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunAgentResultsSummaryCard } from "@/components/runs/RunAgentResultsSummaryCard";

const executeArchitectureRunSelectiveInFlight = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/lib/api/architecture-runs", () => ({
  executeArchitectureRunSelectiveInFlight: (...args: unknown[]) =>
    executeArchitectureRunSelectiveInFlight(...args),
}));

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: (): { refresh: () => void } => ({ refresh: routerRefresh }),
  };
});

describe("RunAgentResultsSummaryCard", () => {
  beforeEach(() => {
    executeArchitectureRunSelectiveInFlight.mockReset();
    executeArchitectureRunSelectiveInFlight.mockResolvedValue(undefined);
    routerRefresh.mockReset();
  });

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

  it("shows a durable acknowledgement and refreshes after selective retry is accepted", async () => {
    render(
      <RunAgentResultsSummaryCard
        results={[]}
        agentExecutionOutcomes={[
          { agentType: "Topology", outcome: "Succeeded" },
          { agentType: "Cost", outcome: "Failed" },
        ]}
        runId="run-1"
      />,
    );

    fireEvent.click(screen.getByTestId("run-agent-retry-failed-button"));

    await waitFor(() => {
      expect(executeArchitectureRunSelectiveInFlight).toHaveBeenCalledWith("run-1", {
        agentTypes: ["Cost"],
        includeDependents: true,
      });
      expect(screen.getByTestId("run-agent-selective-retry-outcome")).toHaveTextContent(
        "Selective retry started for 1 failed agent",
      );
    });

    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("run-agent-selective-retry-error")).not.toBeInTheDocument();
  });

  it("shows the retry error and does not refresh when selective retry fails", async () => {
    executeArchitectureRunSelectiveInFlight.mockRejectedValue(new Error("conflict"));

    render(
      <RunAgentResultsSummaryCard
        results={[]}
        agentExecutionOutcomes={[
          { agentType: "Topology", outcome: "Succeeded" },
          { agentType: "Cost", outcome: "Failed" },
        ]}
        runId="run-1"
      />,
    );

    fireEvent.click(screen.getByTestId("run-agent-retry-failed-button"));

    await waitFor(() => {
      expect(screen.getByTestId("run-agent-selective-retry-error")).toHaveTextContent("conflict");
    });

    expect(screen.queryByTestId("run-agent-selective-retry-outcome")).not.toBeInTheDocument();
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
