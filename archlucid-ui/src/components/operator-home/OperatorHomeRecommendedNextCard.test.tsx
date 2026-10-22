import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  OPERATOR_HOME_RECOMMENDED_NEXT_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import type { RunSummary } from "@/types/authority";

let mockDraftEntries: ArchitectureDraftRegistryEntry[] = [];

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => mockDraftEntries,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: true,
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
});
