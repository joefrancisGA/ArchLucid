import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  OPERATOR_HOME_RECOMMENDED_NEXT_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import type { RunSummary } from "@/types/authority";
import { WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";

let mockDraftEntries: ArchitectureDraftRegistryEntry[] = [];
let mockHasWorkspaceReviews = true;
let mockIncompleteWizards: import("@/lib/unfinished-work-rail").IncompleteWizardSignal[] = [];

vi.mock("@/lib/unfinished-work-rail", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/unfinished-work-rail")>(),
  listIncompleteWizardSignals: () => mockIncompleteWizards,
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => mockDraftEntries,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: mockHasWorkspaceReviews,
    hasOverviewReviewRows: true,
    liveRunsSnapshot: null,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { OperatorHomeRecommendedNextCard } from "@/components/operator-home/OperatorHomeRecommendedNextCard";

describe("OperatorHomeRecommendedNextCard", () => {
  beforeEach(() => {
    mockDraftEntries = [];
    mockHasWorkspaceReviews = true;
    mockIncompleteWizards = [];
  });

  it("renders recommended next label and action on one line", () => {
    const runs = [
      {
        runId: "run-archlucid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "ArchLucid",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeRecommendedNextCard
        runsDashboard={{
          projectId: "default",
          items: runs,
        }}
      />,
    );

    expect(screen.getByTestId("operator-home-recommended-next-card")).toBeInTheDocument();
    expect(screen.getByTestId("inline-guidance-recommended-next")).toHaveTextContent(
      OPERATOR_HOME_RECOMMENDED_NEXT_LABEL,
    );
    expect(screen.getByRole("heading", { name: "Recommended next: Continue ArchLucid review" })).toBeInTheDocument();
    expect(screen.queryByText(/^Recommended next$/)).toBeNull();
    expect(screen.getByTestId("operator-home-recommended-next-cta")).toHaveTextContent("Continue");
  });
  it("recommends a saved wizard when evaluation hides the higher-ranked architecture draft", () => {
    mockHasWorkspaceReviews = false;
    mockDraftEntries = [{
      draftId: "draft-1",
      displayName: "Payments edge",
      customerStatus: "draft",
      ownerLabel: "You",
      lastUpdatedUtc: "2026-08-10T12:00:00Z",
      linkedReviewId: null,
      serverUpdatedUtc: "2026-08-10T12:00:00Z",
      parentArchitectureId: null,
    }];
    mockIncompleteWizards = [{
      wizardId: WIZARD_SESSION_IDS.reviewsNewGuidedQuestions,
      stepIndex: 1,
      savedAtUtc: "2026-08-10T11:00:00Z",
    }];

    render(<OperatorHomeRecommendedNextCard runsDashboard={{ projectId: "default", items: [] }} />);

    expect(screen.getByTestId("operator-home-recommended-next-cta")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?path=guided-intake",
    );
  });
});
