import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecommendationLearningOpsPageClient } from "@/app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient";
import type { RecommendationLearningOperationalStatus } from "@/types/recommendation-learning-operational";
import type { LearningProfile } from "@/types/recommendation-learning";

const reloadBundle = vi.fn();
const reloadPersistedOnly = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
  usePathname: () => "/internal/recommendation-learning",
}));

vi.mock("./load-recommendation-learning-ops-page-data", () => ({
  reloadRecommendationLearningOpsBundle: (...args: unknown[]) => reloadBundle(...args),
  reloadPersistedRecommendationLearningProfileOnly: (...args: unknown[]) => reloadPersistedOnly(...args),
  executeRecommendationLearningPreview: vi.fn(),
  executeRecommendationLearningRebuild: vi.fn(),
  executeRecommendationLearningRollback: vi.fn(),
}));

const baseStatus: RecommendationLearningOperationalStatus = {
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  environmentName: "Development",
  scopeLabel: "Tenant / Workspace / Project",
  profileState: "Active",
  eligibleOutcomeCount: 12,
  proposedOutcomeCount: 0,
  minimumRequiredOutcomes: 5,
  rebuildBatchCap: 5000,
  eligibility: {
    accepted: 4,
    rejected: 2,
    deferred: 3,
    implemented: 3,
    proposedExcluded: 0,
    truncatedByBatchCap: 0,
  },
};

const baseProfile: LearningProfile = {
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  generatedUtc: "2026-08-12T12:00:00Z",
  categoryStats: [],
  urgencyStats: [],
  signalTypeStats: [],
  categoryWeights: { Security: 1.2 },
  urgencyWeights: {},
  signalTypeWeights: {},
  notes: [],
};

describe("RecommendationLearningOpsPageClient TB-1788 toolbar honesty", () => {
  beforeEach(() => {
    reloadBundle.mockReset();
    reloadPersistedOnly.mockReset();
    reloadBundle.mockResolvedValue({
      status: baseStatus,
      profile: baseProfile,
      history: [],
    });
    reloadPersistedOnly.mockResolvedValue(baseProfile);
  });

  it("renders distinct refresh and load-persisted actions with matching helper copy", () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    expect(screen.getByRole("button", { name: "Refresh operational data" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load persisted profile" })).toBeInTheDocument();
    expect(screen.getByText(/reload eligibility counts, profile metadata, and version history/i)).toBeInTheDocument();
    expect(screen.getByText(/fetch the latest stored weighting profile only/i)).toBeInTheDocument();
  });

  it("refresh operational data reloads the full ops bundle", async () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh operational data" }));

    await vi.waitFor(() => {
      expect(reloadBundle).toHaveBeenCalledTimes(1);
    });
    expect(reloadPersistedOnly).not.toHaveBeenCalled();
  });

  it("load persisted profile fetches stored weights without refreshing eligibility counts", async () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={null}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load persisted profile" }));

    await vi.waitFor(() => {
      expect(reloadPersistedOnly).toHaveBeenCalledTimes(1);
    });
    expect(reloadBundle).not.toHaveBeenCalled();
  });
});

describe("RecommendationLearningOpsPageClient TB-1789 enterprise chrome", () => {
  beforeEach(() => {
    reloadBundle.mockReset();
    reloadPersistedOnly.mockReset();
    reloadBundle.mockResolvedValue({
      status: baseStatus,
      profile: baseProfile,
      history: [
        {
          profileId: "profile-v2",
          generatedUtc: "2026-08-12T11:00:00Z",
          outcomeCount: 10,
          isActive: true,
        },
      ],
    });
    reloadPersistedOnly.mockResolvedValue(baseProfile);
  });

  it("uses OperatorPageHeader chrome and StatusTag for profile state", () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[
          {
            profileId: "profile-v2",
            generatedUtc: "2026-08-12T11:00:00Z",
            outcomeCount: 10,
            isActive: true,
          },
        ]}
        initialFailure={null}
      />,
    );

    expect(screen.getByTestId("recommendation-learning-page-title")).toHaveTextContent("Recommendation learning");
    expect(screen.getByTestId("recommendation-learning-ops-eyebrow")).toHaveTextContent(/internal operations/i);
    expect(screen.getByTestId("recommendation-learning-environment-tag")).toBeInTheDocument();
    expect(screen.getByTestId("rl-profile-state")).toHaveTextContent("Active");
    expect(screen.getByRole("table", { name: /profile version history/i })).toBeInTheDocument();
  });

  it("does not render hand-rolled pastel status chrome", () => {
    const { container } = render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    expect(container.innerHTML).not.toMatch(/text-rose-800|text-amber-800|StatusPill/);
  });
});
