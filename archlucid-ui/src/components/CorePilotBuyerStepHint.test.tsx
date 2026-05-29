import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core-pilot-commit-context", () => ({
  fetchCorePilotCommitContext: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: vi.fn(() => true),
}));

import { CorePilotBuyerStepHint } from "@/components/CorePilotBuyerStepHint";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

const mockedFetch = vi.mocked(fetchCorePilotCommitContext);
const mockedBuyerShell = vi.mocked(isBuyerPolishedOperatorShellEnv);

describe("CorePilotBuyerStepHint", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockedBuyerShell.mockReturnValue(true);
  });

  beforeEach(() => {
    mockedFetch.mockResolvedValue({
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    });
  });

  it("renders nothing when buyer shell is off", async () => {
    mockedBuyerShell.mockReturnValue(false);
    const { container } = render(<CorePilotBuyerStepHint />);

    await waitFor(() => {
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });

  it("shows Step 1 of 4 and Evidence intake when no runs", async () => {
    render(<CorePilotBuyerStepHint />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-buyer-step-hint")).toBeInTheDocument();
    });

    expect(screen.getByTestId("core-pilot-buyer-step-badge")).toHaveTextContent("Step 1 of 4");
    expect(screen.getByRole("link", { name: "Evidence intake" })).toHaveAttribute("href", "/reviews/new");
  });

  it("shows Step 2–3 of 4 when a run exists without commit", async () => {
    mockedFetch.mockResolvedValue({
      hasCommittedManifest: false,
      latestRunId: "run-abc",
      firstCommittedRunId: null,
    });

    render(<CorePilotBuyerStepHint />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-buyer-step-badge")).toHaveTextContent("Step 2–3 of 4");
    });

    expect(screen.getByRole("link", { name: "Open your in-progress review" })).toHaveAttribute(
      "href",
      "/reviews/run-abc",
    );
  });

  it("shows Step 4 of 4 when committed", async () => {
    mockedFetch.mockResolvedValue({
      hasCommittedManifest: true,
      latestRunId: "run-latest",
      firstCommittedRunId: "run-gold",
    });

    render(<CorePilotBuyerStepHint />);

    await waitFor(() => {
      expect(screen.getByTestId("core-pilot-buyer-step-badge")).toHaveTextContent("Step 4 of 4");
    });

    expect(screen.getByRole("link", { name: "Open review package" })).toHaveAttribute("href", "/reviews/run-gold");
  });
});
