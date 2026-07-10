import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  PILOT_COMMAND_CENTER_HEADING,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import { PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT } from "@/lib/core-pilot-commit-context";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");
  const mockModule = await createCorePilotCommitContextModuleMock(importOriginal);
  const fetchCorePilotCommitContext = vi.mocked(mockModule.fetchCorePilotCommitContext);

  fetchCorePilotCommitContext.mockResolvedValue({
    hasCommittedManifest: false,
    committedReviewCount: 0,
    latestRunId: null,
    firstCommittedRunId: null,
    secondCommittedRunId: null,
    latestRunReadyToFinalize: false,
  });

  return mockModule;
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

  it("shows dual-path hero copy before committed workspace activity", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-tagline")).toHaveTextContent(
      OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: PILOT_COMMAND_CENTER_HEADING }),
    ).toBeInTheDocument();

    const title = screen.getByRole("heading", { level: 2, name: PILOT_COMMAND_CENTER_HEADING });
    expect(title.className).toContain("text-[15px]");
    expect(title.className).not.toContain("text-lg");

    for (const token of OPERATOR_HOME_CARD_SECTION_HEADING.split(/\s+/)) {
      if (token.length > 0) {
        expect(title.className).toContain(token);
      }
    }

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-dual-path-chooser-guidance")).toHaveTextContent(
      OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
    );
    expect(screen.getByTestId("operator-home-create-architecture-cta")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("operator-home-review-architecture-cta")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("uses dynamic next-best-action copy from Core Pilot commit context after first commit", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pilot-command-center-lead")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-dual-path-cards")).toBeNull();
  });

  it("shows dual-path hero cards without a duplicate sample CTA before first commit", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-open-completed-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-cta-row")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("pilot-path-preview-stepper")).toBeNull();
  });

  it("does not render optional setup links on the hero card", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();
  });
});
