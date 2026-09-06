import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/architecture/reviews/r1/findings",
  });
});

import { FindingsItsmExportToolbar } from "@/components/findings/FindingsItsmExportToolbar";
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

describe("FindingsItsmExportToolbar", () => {
  it("labels export scope when collapsed advisory notes are excluded from the payload", () => {
    render(
      <FindingsItsmExportToolbar
        runId="run-1"
        findings={[finding({ findingId: "f-policy", enforcementTier: "PolicyViolation" })]}
        totalFindingCount={2}
        compact
      />,
    );

    expect(screen.getByText(/Exporting 1 rendered card — 1 advisory note collapsed/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export 1 rendered CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export 1 rendered JSON" })).toBeInTheDocument();
  });

  it("labels checklist coverage omitted from ITSM export", () => {
    render(
      <FindingsItsmExportToolbar
        runId="run-1"
        findings={[
          finding({ findingId: "f-policy", enforcementTier: "PolicyViolation", classification: "DecisionGradeFinding" }),
          finding({ findingId: "f-checklist", enforcementTier: "Advisory", classification: "ChecklistCoverage" }),
        ]}
        compact
      />,
    );

    expect(
      screen.getByText("Exporting 1 decision-grade finding (1 checklist coverage omitted)."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export 1 CSV" })).toBeInTheDocument();
  });
});
