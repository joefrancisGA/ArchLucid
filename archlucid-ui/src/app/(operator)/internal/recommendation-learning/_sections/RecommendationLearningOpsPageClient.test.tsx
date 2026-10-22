import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecommendationLearningOpsPageClient } from "@/app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient";
import type { RecommendationLearningOperationalStatus } from "@/types/recommendation-learning-operational";
import type { LearningProfile } from "@/types/recommendation-learning";

const reloadBundle = vi.fn();
const reloadPersistedOnly = vi.fn();
const operateCapabilityMocks = vi.hoisted(() => ({
  canMutate: true,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => operateCapabilityMocks.canMutate,
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

const executePreview = vi.fn();
const executeRebuild = vi.fn();
const executeRollback = vi.fn();

vi.mock("./load-recommendation-learning-ops-page-data", () => ({
  reloadRecommendationLearningOpsBundle: (...args: unknown[]) => reloadBundle(...args),
  reloadPersistedRecommendationLearningProfileOnly: (...args: unknown[]) => reloadPersistedOnly(...args),
  executeRecommendationLearningPreview: (...args: unknown[]) => executePreview(...args),
  executeRecommendationLearningRebuild: (...args: unknown[]) => executeRebuild(...args),
  executeRecommendationLearningRollback: (...args: unknown[]) => executeRollback(...args),
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

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load persisted profile" })).toBeInTheDocument();
    expect(screen.getByTestId("recommendation-learning-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("recommendation-learning-claim-discipline")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

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

describe("RecommendationLearningOpsPageClient TB-1790 preview/rebuild/rollback + Execute gate", () => {
  beforeEach(() => {
    operateCapabilityMocks.canMutate = true;
    reloadBundle.mockReset();
    reloadPersistedOnly.mockReset();
    executePreview.mockReset();
    executeRebuild.mockReset();
    executeRollback.mockReset();
    reloadBundle.mockResolvedValue({
      status: baseStatus,
      profile: baseProfile,
      history: [
        {
          profileId: "profile-v1",
          generatedUtc: "2026-08-12T10:00:00Z",
          outcomeCount: 8,
          isActive: false,
        },
        {
          profileId: "profile-v2",
          generatedUtc: "2026-08-12T11:00:00Z",
          outcomeCount: 10,
          isActive: true,
        },
      ],
    });
    executePreview.mockResolvedValue({
      proposedProfile: baseProfile,
      weightDeltas: [
        {
          featureGroup: "Category",
          feature: "Security",
          currentWeight: 1,
          proposedWeight: 1.2,
          absoluteDelta: 0.2,
          percentageDelta: 20,
          observationCount: 4,
          confidence: 0.9,
          fallbackUsed: false,
        },
      ],
      validationChecks: [{ name: "Minimum outcomes", result: "Pass", detail: "Eligible count meets threshold." }],
      sourceRecordCount: 12,
      eligibleRecordCount: 12,
      correlationId: "corr-preview-1",
      buildDurationMs: 42,
    });
    executeRebuild.mockResolvedValue(baseProfile);
    executeRollback.mockResolvedValue(baseProfile);
  });

  it("runs preview rebuild and surfaces validation checks", async () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Preview rebuild" }));

    await vi.waitFor(() => {
      expect(executePreview).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Minimum outcomes")).toBeInTheDocument();
    });
    expect(screen.getByText("Pass")).toBeInTheDocument();
    expect(screen.getByText(/corr-preview-1/)).toBeInTheDocument();
  });

  it("runs rebuild from historical outcomes and refreshes the ops bundle", async () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rebuild from historical outcomes" }));

    await vi.waitFor(() => {
      expect(executeRebuild).toHaveBeenCalledTimes(1);
      expect(reloadBundle).toHaveBeenCalledTimes(1);
    });
  });

  it("requires ExecuteAuthority before preview, rebuild, and rollback actions", () => {
    operateCapabilityMocks.canMutate = false;

    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[
          {
            profileId: "profile-v1",
            generatedUtc: "2026-08-12T10:00:00Z",
            outcomeCount: 8,
            isActive: false,
          },
        ]}
        initialFailure={null}
      />,
    );

    expect(screen.getByTestId("recommendation-learning-read-only-hint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview rebuild" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rebuild from historical outcomes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Roll back to this version" })).toBeDisabled();
  });

  it("disables preview and rebuild when eligible outcomes are below the minimum", () => {
    const insufficientStatus: RecommendationLearningOperationalStatus = {
      ...baseStatus,
      profileState: "InsufficientData",
      eligibleOutcomeCount: 2,
      minimumRequiredOutcomes: 5,
    };

    render(
      <RecommendationLearningOpsPageClient
        initialStatus={insufficientStatus}
        initialProfile={null}
        initialHistory={[]}
        initialFailure={null}
      />,
    );

    expect(screen.getByTestId("rl-profile-state")).toHaveTextContent("Insufficient data");
    expect(screen.getByRole("button", { name: "Preview rebuild" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rebuild from historical outcomes" })).toBeDisabled();
  });

  it("rolls back to a historical profile after an operational reason is supplied", async () => {
    render(
      <RecommendationLearningOpsPageClient
        initialStatus={baseStatus}
        initialProfile={baseProfile}
        initialHistory={[
          {
            profileId: "profile-v1",
            generatedUtc: "2026-08-12T10:00:00Z",
            outcomeCount: 8,
            isActive: false,
          },
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

    fireEvent.click(screen.getByRole("button", { name: "Roll back to this version" }));
    fireEvent.change(screen.getByPlaceholderText("Operational reason (required)"), {
      target: { value: "Rollback after bad activation" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rollback" }));

    await vi.waitFor(() => {
      expect(executeRollback).toHaveBeenCalledWith("profile-v1", "Rollback after bad activation");
      expect(reloadBundle).toHaveBeenCalledTimes(1);
    });
  });
});
