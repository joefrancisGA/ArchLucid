import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FirstValueLanePanel } from "./FirstValueLanePanel";

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => ({ status: "ready" })),
}));

vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [] })),
}));

vi.mock("@/lib/core-pilot-commit-context", () => ({
  fetchCorePilotCommitContext: vi.fn(async () => ({
    hasCommittedManifest: false,
    committedReviewCount: 0,
    latestRunId: null,
    firstCommittedRunId: null,
    secondCommittedRunId: null,
  })),
}));

describe("FirstValueLanePanel", () => {
  it("renders four lane phases with status markers", async () => {
    render(<FirstValueLanePanel />);

    expect(await screen.findByTestId("first-value-lane-panel")).toBeInTheDocument();
    expect(screen.getByText("First-value lane")).toBeInTheDocument();
    expect(screen.getByTestId("first-value-lane-phase-create-review")).toBeInTheDocument();
    expect(screen.getByTestId("first-value-lane-phase-retrieve-sponsor-artifact")).toBeInTheDocument();
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
  });
});
