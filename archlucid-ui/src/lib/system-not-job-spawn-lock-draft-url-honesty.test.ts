import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE,
  ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE,
  ARCHITECTURE_DRAFT_SPAWN_LOCK_WORKSPACE_LEAD,
  resolveArchitectureDraftSpawnLockWorkspaceLead,
} from "@/lib/architecture/architecture-draft-spawn-lock-url-honesty";

const REPO_ROOT = join(process.cwd(), "..");

describe("system-not-job spawn-lock draft URL honesty (SN-003)", () => {
  it("states snapshot honesty and clone as the legal new version (WA-10 / ADR 0072)", () => {
    expect(ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE).toMatch(/snapshot/i);
    expect(ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE).toMatch(/not the live editor/i);
    expect(ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE).toMatch(/legal new version/i);
    expect(ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE).toMatch(/snapshot/i);
  });

  it("replaces drafting workspace lead when spawn-locked", () => {
    expect(
      resolveArchitectureDraftSpawnLockWorkspaceLead(true, "Drafting workspace — editing or saving does not start a review."),
    ).toBe(ARCHITECTURE_DRAFT_SPAWN_LOCK_WORKSPACE_LEAD);
    expect(resolveArchitectureDraftSpawnLockWorkspaceLead(false, "Default lead")).toBe("Default lead");
  });

  it("wires honesty copy into handoff banner, panel, and workspace body", () => {
    const handoffGate = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/architecture/architecture-draft-handoff-gate.ts"),
      "utf8",
    );
    const handoffPanel = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftHandoffPanel.tsx"),
      "utf8",
    );
    const workspaceBody = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx"),
      "utf8",
    );

    expect(handoffGate).toContain("ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE");
    expect(handoffPanel).toContain("data-spawn-lock-url-honesty");
    expect(handoffPanel).toContain("architecture-draft-spawn-lock-clone-honesty");
    expect(handoffPanel).toContain("ArchitectureDraftCloneSnapshotControl");
    expect(workspaceBody).toMatch(/handoffEditorLocked && linkedReviewId !== null/);
    expect(workspaceBody).not.toMatch(/isWorkingMode && handoffEditorLocked/);
    expect(existsSync(join(REPO_ROOT, "archlucid-ui/src/lib/architecture/architecture-draft-spawn-lock-url-honesty.ts"))).toBe(
      true,
    );
  });
});
