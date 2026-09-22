import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ArchitectureDraftCloneSnapshotControl,
  ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL,
} from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { isArchitectureDraftHandoffAcknowledged } from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

const cloneDraftSnapshot = vi.fn();
const push = vi.fn();
const upsertArchitectureDraftRegistryEntry = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  cloneDraftSnapshot: (...args: unknown[]) => cloneDraftSnapshot(...args),
}));

vi.mock("@/lib/architecture/architecture-draft-registry", () => ({
  buildArchitectureDraftRegistryEntry: (clone: unknown) => clone,
  upsertArchitectureDraftRegistryEntry: (...args: unknown[]) => upsertArchitectureDraftRegistryEntry(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({
    effectiveDoor: "rehearsal",
    mounted: true,
  }),
}));

const useDraftBranchQuotaQuery = vi.fn();

vi.mock("@/hooks/use-draft-branch-quota-query", () => ({
  useDraftBranchQuotaQuery: (...args: unknown[]) => useDraftBranchQuotaQuery(...args),
}));

describe("architecture-draft-clone-snapshot", () => {
  beforeEach(() => {
    cloneDraftSnapshot.mockReset();
    push.mockReset();
    upsertArchitectureDraftRegistryEntry.mockReset();
    useDraftBranchQuotaQuery.mockReturnValue({
      data: {
        draftId: "draft-source-001",
        existingBranchCount: 0,
        maxBranchesPerParent: 3,
        remainingBranches: 3,
        canBranch: true,
        estimatedBranchRunCostUsd: 4.5,
      },
      isLoading: false,
      isError: false,
    });
  });

  it("keeps the post-spawn ack helper disabled", () => {
    expect(isArchitectureDraftHandoffAcknowledged("arch-spawned")).toBe(false);
  });

  it("exports the secondary CTA label for spawned snapshots", () => {
    expect(ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL).toBe("Start a new draft from this snapshot");
  });

  it("SN-008 / CE-001: spawn-locked desk action uses Sketch a change label and confirm gate", async () => {
    cloneDraftSnapshot.mockResolvedValue({
      clone: {
        draftId: "draft-clone-001",
        architectureId: "architecture-identity-001",
      },
    });

    render(
      <ArchitectureDraftCloneSnapshotControl
        draftId="draft-source-001"
        parentArchitectureId="architecture-identity-001"
        spawnLockedDeskAction
      />,
    );

    expect(screen.getByTestId(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID)).toHaveTextContent(
      SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
    );

    fireEvent.click(screen.getByTestId(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID));

    expect(screen.getByTestId("architecture-draft-clone-snapshot-confirm")).toBeInTheDocument();
    expect(cloneDraftSnapshot).not.toHaveBeenCalled();

    expect(screen.getByTestId("architecture-what-if-cost-cap-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-what-if-cost-cap-not-budget-pill")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start new version" }));

    await waitFor(() => {
      expect(cloneDraftSnapshot).toHaveBeenCalledWith("draft-source-001");
    });
  });

  it("SN-009: disables confirm when branch cap is exhausted (TB-2005)", async () => {
    useDraftBranchQuotaQuery.mockReturnValue({
      data: {
        draftId: "draft-source-001",
        existingBranchCount: 3,
        maxBranchesPerParent: 3,
        remainingBranches: 0,
        canBranch: false,
        estimatedBranchRunCostUsd: 4.5,
      },
      isLoading: false,
      isError: false,
    });

    render(
      <ArchitectureDraftCloneSnapshotControl
        draftId="draft-source-001"
        parentArchitectureId="architecture-identity-001"
        spawnLockedDeskAction
      />,
    );

    fireEvent.click(screen.getByTestId(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID));

    expect(screen.getByTestId("architecture-what-if-cost-cap-over-cap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start new version" })).toBeDisabled();
    expect(cloneDraftSnapshot).not.toHaveBeenCalled();
  });

  it("AO-36: navigates to nested draft under parent architecture after clone without confirm", async () => {
    cloneDraftSnapshot.mockResolvedValue({
      clone: {
        draftId: "draft-clone-001",
        architectureId: "architecture-identity-001",
      },
    });

    render(
      <ArchitectureDraftCloneSnapshotControl
        draftId="draft-source-001"
        parentArchitectureId="architecture-identity-001"
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-clone-snapshot"));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/architecture/architectures/architecture-identity-001/drafts/draft-clone-001",
      );
    });

    expect(cloneDraftSnapshot).toHaveBeenCalledWith("draft-source-001");
  });

  it("AO-36: falls back to parentArchitectureId when clone response omits architectureId", async () => {
    cloneDraftSnapshot.mockResolvedValue({
      clone: {
        draftId: "draft-clone-002",
        architectureId: null,
      },
    });

    render(
      <ArchitectureDraftCloneSnapshotControl
        draftId="draft-source-002"
        parentArchitectureId="architecture-identity-001"
      />,
    );

    fireEvent.click(screen.getByTestId("architecture-draft-clone-snapshot"));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/architecture/architectures/architecture-identity-001/drafts/draft-clone-002",
      );
    });
  });
});
