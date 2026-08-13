import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RunDetailLastFailureCard } from "@/components/runs/RunDetailLastFailureCard";
import { findForbiddenQualityOutagePhrases } from "@/lib/execution-vs-quality-outcome-copy";

describe("RunDetailLastFailureCard (TB-965)", () => {
  it("renders quality-rejected copy without outage phrasing", () => {
    render(
      <RunDetailLastFailureCard
        summary={{
          agentType: "Critic",
          failureClass: "qualityGate",
          triageScenarioId: "groundingInsufficiency",
          rejectReasonCategory: "faithfulness",
        }}
        legacyRunStatus="ExecutionCompletedQualityRejected"
      />,
    );

    expect(screen.getByTestId("run-detail-last-failure-card")).toHaveAttribute(
      "data-failure-axis",
      "quality",
    );
    expect(screen.getByText(/Quality gate rejected — HOLD \(not an outage\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reject category:/i)).toBeInTheDocument();
    expect(screen.getByText(/citations or evidence support below the bar/i)).toBeInTheDocument();

    const text = screen.getByTestId("run-detail-last-failure-card").textContent ?? "";

    expect(findForbiddenQualityOutagePhrases(text)).toEqual([]);
    expect(text.toLowerCase()).not.toContain("llm error");
    expect(text.toLowerCase()).not.toContain("model failed");
  });

  it("renders execution-failed copy for transport failures", () => {
    render(
      <RunDetailLastFailureCard
        summary={{
          agentType: "Topology",
          failureClass: "timeout",
          triageScenarioId: "timeout",
        }}
        legacyRunStatus="Failed"
      />,
    );

    expect(screen.getByTestId("run-detail-last-failure-card")).toHaveAttribute(
      "data-failure-axis",
      "execution",
    );
    expect(screen.getByText("Agent execution failed")).toBeInTheDocument();
  });
});
