import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeFirstRunWorkflowGate } from "./HomeFirstRunWorkflowGate";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
  isBuyerSafeDemoMarketingChromeEnv: vi.fn(() => false),
  isOperatorExperienceFullShellEnv: vi.fn(() => true),
}));

vi.mock("@/lib/core-pilot-commit-context", () => ({
  fetchCorePilotCommitContext: vi.fn(),
}));

vi.mock("@/components/OperatorFirstRunWorkflowPanel", () => ({
  OperatorFirstRunWorkflowPanel: () => <div data-testid="first-run-panel-mock" />,
}));

vi.mock("@/components/operator-home/SamplePackageShortcutsCard", () => ({
  SamplePackageShortcutsCard: () => <div data-testid="sample-package-shortcuts-card" />,
}));

describe("HomeFirstRunWorkflowGate", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hides the first-run panel after a committed manifest", async () => {
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      hasCommittedManifest: true,
      latestRunId: "run-1",
      firstCommittedRunId: "run-1",
    });

    render(<HomeFirstRunWorkflowGate />);

    await waitFor(() => {
      expect(screen.queryByTestId("first-run-panel-mock")).not.toBeInTheDocument();
    });
  });

  it("shows the first-run panel before a committed manifest", async () => {
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    });

    render(<HomeFirstRunWorkflowGate />);

    expect(await screen.findByTestId("first-run-panel-mock")).toBeInTheDocument();
  });

  it("renders sample shortcuts immediately on curated rail without waiting for commit probe", async () => {
    const { isOperatorExperienceFullShellEnv } = await import("@/lib/demo-ui-env");
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(isOperatorExperienceFullShellEnv).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockImplementation(() => new Promise(() => {}));

    render(<HomeFirstRunWorkflowGate />);

    expect(screen.getByTestId("sample-package-shortcuts-card")).toBeInTheDocument();
    expect(fetchCorePilotCommitContext).not.toHaveBeenCalled();
  });
});
