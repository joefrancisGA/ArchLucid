import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";

vi.mock("@/components/FirstPilotProofStatusStrip", () => ({
  FirstPilotProofStatusStrip: () => <div data-testid="proof-status-strip-mock" />,
}));

vi.mock("@/components/OperatorAiQualityProofCard", () => ({
  OperatorAiQualityProofCard: () => <div data-testid="ai-quality-proof-mock" />,
}));

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => ({ status: "Healthy" })),
}));

vi.mock("@/lib/operator-run-picker-client", () => ({
  loadProjectRunsMergedWithDemoFallback: vi.fn(async () => ({ items: [], loadError: false })),
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

vi.mock("@/lib/current-principal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/current-principal")>();

  return {
    ...actual,
    loadCurrentPrincipal: vi.fn(async () => actual.shellBootstrapReadPrincipal),
  };
});

vi.mock("@/lib/api", () => ({
  getPilotScorecard: vi.fn(async () => null),
}));

vi.mock("@/lib/fetch-admin-config-lint", () => ({
  fetchAdminConfigLintSummary: vi.fn(async () => ({
    blockingCount: 0,
    advisoryCount: 0,
    loadFailed: false,
  })),
}));

describe("FirstPilotReadinessCockpit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the workspace shell after readiness probes hydrate", async () => {
    render(<FirstPilotReadinessCockpit />);

    expect(screen.getByTestId("first-pilot-readiness-cockpit-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-readiness-cockpit")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Workspace readiness" })).toBeInTheDocument();
    expect(screen.getByTestId("first-pilot-command-center-next-action")).toBeInTheDocument();
  });

  it("collapses and expands from the header chevron", async () => {
    render(<FirstPilotReadinessCockpit />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-command-center-next-action")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Collapse Workspace readiness" }));

    expect(screen.queryByTestId("first-pilot-command-center-next-action")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand Workspace readiness" }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-command-center-next-action")).toBeInTheDocument();
    });
  });
});
