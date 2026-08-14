import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailHolisticCriticPanel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailHolisticCriticPanel";

vi.mock("@/lib/api/holistic-critic-api", () => ({
  generateHolisticCritique: vi.fn(),
}));

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 25,
      assumedNextCallReservationUsd: 0.5,
      hardCapUtilizationFraction: 0.33,
      warnFraction: 0.75,
      remainingBudgetUsd: 50,
    },
    blocksLlmExecution: false,
  }),
}));

describe("RunDetailHolisticCriticPanel", () => {
  it("renders nothing when the review is not committed", () => {
    const { container } = render(
      <RunDetailHolisticCriticPanel runId="run-1" hasGoldenManifest={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows advisory governance label after critique is generated", async () => {
    const { generateHolisticCritique } = await import("@/lib/api/holistic-critic-api");
    vi.mocked(generateHolisticCritique).mockResolvedValue({
      disclaimer: "Advisory only.",
      critiqueMarkdown: "Consider regional failover.",
    });

    render(<RunDetailHolisticCriticPanel runId="run-1" hasGoldenManifest={true} />);

    expect(screen.getByTestId("holistic-critic-budget-notice")).toHaveTextContent(
      "Holistic critique uses AI budget.",
    );

    screen.getByTestId("holistic-critic-generate").click();

    expect(await screen.findByTestId("ai-output-governance-label-advisory")).toBeInTheDocument();
  });
});
