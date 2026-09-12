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

vi.mock("@/hooks/use-draft-branch-quota-query", () => ({
  useDraftBranchQuotaQuery: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

describe("architecture-draft-clone-snapshot", () => {
  beforeEach(() => {
    cloneDraftSnapshot.mockReset();
    push.mockReset();
    upsertArchitectureDraftRegistryEntry.mockReset();
  });

  it("keeps the post-spawn ack helper disabled", () => {
    expect(isArchitectureDraftHandoffAcknowledged("arch-spawned")).toBe(false);
  });

  it("exports the secondary CTA label for spawned snapshots", () => {
    expect(ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL).toBe("Start a new draft from this snapshot");
  });

  it("SN-008: spawn-locked desk action uses New version (clone) label and confirm gate", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Start new version" }));

    await waitFor(() => {
      expect(cloneDraftSnapshot).toHaveBeenCalledWith("draft-source-001");
    });
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
