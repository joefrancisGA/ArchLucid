import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FIRST_VALUE_LANE_PHASES } from "@/lib/first-value-lane";

import { FirstValueLanePanel } from "./FirstValueLanePanel";

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => ({ status: "ready" })),
}));

vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [] })),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

describe("FirstValueLanePanel", () => {
  it("renders the first-value lane heading without a lane runbook link", async () => {
    render(<FirstValueLanePanel />);

    expect(await screen.findByTestId("first-value-lane-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "First-value lane" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /lane runbook/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Lane runbook")).not.toBeInTheDocument();
  });

  it("renders all four first-value lane steps", async () => {
    render(<FirstValueLanePanel />);

    await screen.findByTestId("first-value-lane-panel");

    for (const phase of FIRST_VALUE_LANE_PHASES) {
      expect(screen.getByTestId(`first-value-lane-phase-${phase.id}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(phase.title, "i"))).toBeInTheDocument();
    }
  });

  it("renders the Start architecture review action for the active create-review step", async () => {
    render(<FirstValueLanePanel />);

    await screen.findByTestId("first-value-lane-panel");

    const startReview = screen.getByRole("link", { name: "Start architecture review" });

    expect(startReview).toBeInTheDocument();
    expect(startReview).toHaveAttribute("href", "/reviews/new");
  });

  it("renders four lane phases with status markers", async () => {
    render(<FirstValueLanePanel />);

    expect(await screen.findByTestId("first-value-lane-panel")).toBeInTheDocument();
    expect(screen.getByTestId("first-value-lane-phase-create-review")).toBeInTheDocument();
    expect(screen.getByTestId("first-value-lane-phase-retrieve-sponsor-artifact")).toBeInTheDocument();
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
  });
});
