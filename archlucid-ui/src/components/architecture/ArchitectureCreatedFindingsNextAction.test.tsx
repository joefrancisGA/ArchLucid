import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedFindingsNextAction } from "@/components/architecture/ArchitectureCreatedFindingsNextAction";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("ArchitectureCreatedFindingsNextAction", () => {
  it("surfaces triage CTA when findings exist", () => {
    render(
      <ArchitectureCreatedFindingsNextAction
        runId="run-1"
        findings={[finding({ findingId: "f-high", severityValue: 3, findingOrder: 0 })]}
        analysisStagesComplete={false}
      />,
    );

    const link = screen.getByTestId("architecture-findings-triage-primary-action");
    expect(link).toHaveAttribute("href", "/architecture/reviews/run-1/findings/f-high");
  });

  it("skips muted and low-confidence rows when choosing triage target", () => {
    render(
      <ArchitectureCreatedFindingsNextAction
        runId="run-1"
        findings={[
          finding({ findingId: "f-muted-critical", severityValue: 4, isMuted: true }),
          finding({
            findingId: "f-low-conf",
            severityValue: 3,
            confidenceLevel: "Low",
            enforcementTier: "Advisory",
          }),
          finding({ findingId: "f-visible", severityValue: 2, confidenceLevel: "High" }),
        ]}
        analysisStagesComplete={false}
      />,
    );

    expect(screen.getByTestId("architecture-findings-triage-primary-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/f-visible",
    );
  });

  it("skips disposition-closed findings when choosing triage target", () => {
    render(
      <ArchitectureCreatedFindingsNextAction
        runId="run-1"
        findings={[
          finding({
            findingId: "f-accepted-critical",
            severityValue: 4,
            aiReasoning: {
              wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
              reasoningTrace: "",
            },
          }),
          finding({ findingId: "f-open", severityValue: 2, confidenceLevel: "High" }),
        ]}
        analysisStagesComplete={false}
      />,
    );

    expect(screen.getByTestId("architecture-findings-triage-primary-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/f-open",
    );
  });

  it("surfaces finalize readiness when only disposition-closed findings remain", () => {
    render(
      <ArchitectureCreatedFindingsNextAction
        runId="run-1"
        findings={[
          finding({
            findingId: "f-accepted-critical",
            severityValue: 4,
            aiReasoning: {
              wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
              reasoningTrace: "",
            },
          }),
        ]}
        analysisStagesComplete
      />,
    );

    expect(screen.getByTestId("architecture-findings-finalize-primary-action")).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=policies"),
    );
  });

  it("surfaces finalize readiness when stages complete with zero findings", () => {
    render(
      <ArchitectureCreatedFindingsNextAction runId="run-1" findings={[]} analysisStagesComplete />,
    );

    expect(screen.getByTestId("architecture-findings-finalize-primary-action")).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=policies"),
    );
  });

  it("routes to assessment progress while stages are incomplete", () => {
    const onNavigateActivity = vi.fn();

    render(
      <ArchitectureCreatedFindingsNextAction
        runId="run-1"
        findings={[]}
        analysisStagesComplete={false}
        onNavigateActivity={onNavigateActivity}
      />,
    );

    screen.getByTestId("architecture-findings-activity-primary-action").click();
    expect(onNavigateActivity).toHaveBeenCalledTimes(1);
  });
});
