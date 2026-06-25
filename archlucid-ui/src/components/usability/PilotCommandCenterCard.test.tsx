import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import {
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import { PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT } from "@/lib/core-pilot-commit-context";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/core-pilot-commit-context")>();

  return {
    ...actual,
    fetchCorePilotCommitContext: vi.fn(async () => ({
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    })),
  };
});

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";

const emptyCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("PilotCommandCenterCard", () => {
  beforeEach(() => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(emptyCommitContext);
  });
  it("shows first-review hero copy before committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: PILOT_COMMAND_CENTER_HEADING }),
    ).toBeInTheDocument();
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    render(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("uses dynamic next-best-action copy from Core Pilot commit context", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent("Start review");
    });

    expect(screen.getByTestId("pilot-next-best-action")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("review package");
  });

  it("shows workflow steps below the header row before first commit", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();

    for (const step of PILOT_PATH_PREVIEW_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("hides optional setup footer after first commit", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    render(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
  });
});
