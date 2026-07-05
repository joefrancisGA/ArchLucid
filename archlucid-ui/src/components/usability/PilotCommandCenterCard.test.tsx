import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT } from "@/lib/core-pilot-commit-context";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

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
  it("shows first-review hero copy before committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: PILOT_COMMAND_CENTER_HEADING }),
    ).toBeInTheDocument();
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("uses dynamic next-best-action copy from Core Pilot commit context", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent(OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA);
    });

    expect(screen.getByTestId("pilot-next-best-action")).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(screen.getByTestId("pilot-command-center-lead").textContent).toBe(PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY);
    expect(screen.getByTestId("pilot-command-center-start-own-review")).toHaveAttribute("href", "/reviews/new");
  });

  it("shows workflow steps below the header row before first commit", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();

    for (const step of PILOT_PATH_PREVIEW_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("hides optional setup footer after first commit", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
  });

  it("renders optional setup links as outline buttons with visible affordance", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    const connectCloud = screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE });
    const inviteReviewer = screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER });

    expect(connectCloud).toHaveAttribute("href", CLOUD_CONNECTIONS_PATH);
    expect(connectCloud.className).toMatch(/border/);
    expect(inviteReviewer.className).toMatch(/border/);
    expect(screen.getByTestId("pilot-next-best-action").className).not.toMatch(/border-neutral-300/);
  });

  it("renders first-hour hero CTAs as balanced primary and outline buttons", async () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent(
        OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
      );
    });

    const openSample = screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA });
    const startOwnReview = screen.getByRole("link", { name: PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK });

    expect(openSample).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(startOwnReview).toHaveAttribute("href", "/reviews/new");
    expect(openSample.className).toMatch(/bg-\[var\(--al-primary-action-bg\)\]/);
    expect(openSample.className).not.toMatch(/underline/);
    expect(startOwnReview.className).toMatch(/border-neutral-300/);
    expect(startOwnReview.className).not.toMatch(/bg-\[var\(--al-primary-action-bg\)\]/);
    expect(startOwnReview.className).not.toMatch(/underline/);
  });
});
