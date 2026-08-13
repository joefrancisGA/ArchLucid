import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeFirstRunWorkflowGate } from "./HomeFirstRunWorkflowGate";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.unmock("@/hooks/use-core-pilot-commit-context-query");

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
    isBuyerSafeDemoMarketingChromeEnv: vi.fn(() => false),
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
  };
});

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

vi.mock("@/components/operator/OperatorFirstRunWorkflowPanel", () => ({
  OperatorFirstRunWorkflowPanel: () => <div data-testid="first-run-panel-mock" />,
}));

vi.mock("@/components/operator-home/SamplePackageShortcutsCard", () => ({
  SamplePackageShortcutsCard: () => <div data-testid="sample-package-shortcuts-card" />,
}));

describe("HomeFirstRunWorkflowGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("hides the first-run panel after a committed manifest", async () => {
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      hasCommittedManifest: true,
      committedReviewCount: 1,
      latestRunId: "run-1",
      firstCommittedRunId: "run-1",
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    });

    renderWithOperatorQuery(<HomeFirstRunWorkflowGate />);

    await waitFor(() => {
      expect(screen.queryByTestId("first-run-panel-mock")).not.toBeInTheDocument();
    });
  });

  it("shows the first-run panel before a committed manifest", async () => {
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    });

    renderWithOperatorQuery(<HomeFirstRunWorkflowGate />);

    expect(await screen.findByTestId("first-run-panel-mock")).toBeInTheDocument();
  });

  it("renders sample shortcuts immediately on curated rail without waiting for commit probe", async () => {
    const { isOperatorExperienceFullShellEnv } = await import("@/lib/demo-ui-env");
    const { fetchCorePilotCommitContext } = await import("@/lib/core-pilot-commit-context");

    vi.mocked(isOperatorExperienceFullShellEnv).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockImplementation(() => new Promise(() => {}));

    renderWithOperatorQuery(<HomeFirstRunWorkflowGate />);

    expect(screen.getByTestId("sample-package-shortcuts-card")).toBeInTheDocument();
    expect(fetchCorePilotCommitContext).not.toHaveBeenCalled();
  });
});
