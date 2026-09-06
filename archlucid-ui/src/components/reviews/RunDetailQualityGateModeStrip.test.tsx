import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailQualityGateModeStrip } from "./RunDetailQualityGateModeStrip";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("@/hooks/use-health-ready-summary-query", () => ({
  useHealthReadySummaryQuery: () => ({
    data: {
      agentExecutionMode: "Real",
      agentOutputQualityGateMode: "WarnOnly",
      preCommitGateEnabled: true,
      status: "Healthy",
      entries: [],
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      runId: "run-1",
      evaluatedAtUtc: "2026-01-01T00:00:00Z",
      recorded: {
        authority: "recorded",
        gateDefinition: {
          definitionVersion: "v1",
          contentHashSha256: "abc",
          mode: "WarnOnly",
          effectiveFromUtc: "2026-01-01T00:00:00Z",
        },
        scores: [],
        tracesSkippedCount: 0,
        averageStructuralCompletenessRatio: null,
        averageSemanticScore: null,
        aggregateQualityGateOutcome: 0,
      },
      advisoryCurrent: {
        authority: "advisoryCurrent",
        scores: [],
        tracesSkippedCount: 0,
        averageStructuralCompletenessRatio: null,
        averageSemanticScore: null,
      },
    },
  }),
}));

describe("RunDetailQualityGateModeStrip (DR-05)", () => {
  it("shows recorded WarnOnly mode and honesty copy on Working real-mode runs", () => {
    render(
      <RunDetailQualityGateModeStrip
        runId="run-1"
        structuralExecutionMode="Real"
        isSample={false}
      />,
    );

    expect(screen.getByTestId("run-detail-quality-gate-mode-strip")).toHaveTextContent(
      "Quality gate: WarnOnly",
    );
    expect(screen.getByTestId("run-detail-quality-gate-mode-strip")).toHaveTextContent(
      "not career-complete",
    );
  });
});
