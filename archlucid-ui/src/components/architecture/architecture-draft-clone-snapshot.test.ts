import { describe, expect, it, vi } from "vitest";

import { ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL } from "@/components/architecture/ArchitectureDraftCloneSnapshotControl";
import { isArchitectureDraftHandoffAcknowledged } from "@/lib/architecture/architecture-draft-handoff-gate";

const cloneDraftSnapshot = vi.fn();
const push = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  cloneDraftSnapshot: (...args: unknown[]) => cloneDraftSnapshot(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("architecture-draft-clone-snapshot", () => {
  it("keeps the post-spawn ack helper disabled", () => {
    expect(isArchitectureDraftHandoffAcknowledged("arch-spawned")).toBe(false);
  });

  it("exports the secondary CTA label for spawned snapshots", () => {
    expect(ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL).toBe("Start a new draft from this snapshot");
  });
});
