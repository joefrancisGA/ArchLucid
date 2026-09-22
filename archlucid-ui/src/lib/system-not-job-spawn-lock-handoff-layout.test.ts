import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveSpawnLockHandoffSnapshotSummaryRows,
  shouldRenderSpawnLockedHandoffLayout,
  SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS,
  SYSTEM_NOT_JOB_SPAWN_LOCK_HANDOFF_LAYOUT_DOC_ANCHOR,
} from "@/lib/system-not-job-spawn-lock-handoff-layout";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief-state";
import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-013 spawn-lock handoff layout (LK-04 leftover)", () => {
  it("replaces disabled editor chrome when spawn-locked with a linked review", () => {
    expect(
      shouldRenderSpawnLockedHandoffLayout({
        handoffEditorLocked: true,
        linkedReviewId: "run-42",
      }),
    ).toBe(true);
    expect(
      shouldRenderSpawnLockedHandoffLayout({
        handoffEditorLocked: false,
        linkedReviewId: "run-42",
      }),
    ).toBe(false);
    expect(
      shouldRenderSpawnLockedHandoffLayout({
        handoffEditorLocked: true,
        linkedReviewId: null,
      }),
    ).toBe(false);
  });

  it("renders snapshot summary rows for architecture, outcome, and intent", () => {
    const rows = resolveSpawnLockHandoffSnapshotSummaryRows({
      workspaceHeading: "Payments modernization",
      fields: {
        businessOutcome: "Reduce settlement risk",
        freeTextIntent: "Migrate card capture to the new platform.",
        systemName: "Payments",
        structuredBrief: emptyArchitectureDraftStructuredBrief(),
      },
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Architecture",
      "Business outcome",
      "Intent summary",
    ]);
    expect(rows[0]?.value).toBe("Payments modernization");
    expect(rows[1]?.value).toBe("Reduce settlement risk");
    expect(rows[2]?.value).toContain("Migrate card capture");
  });

  it("wires handoff layout gate into workspace body and snapshot summary component", () => {
    const workspaceBody = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx"),
      "utf8",
    );
    const handoffPanel = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftHandoffPanel.tsx"),
      "utf8",
    );
    const snapshotSummary = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/components/architecture/ArchitectureDraftSpawnLockSnapshotSummary.tsx",
      ),
      "utf8",
    );

    expect(workspaceBody).toContain("shouldRenderSpawnLockedHandoffLayout");
    expect(handoffPanel).toContain("ArchitectureDraftSpawnLockSnapshotSummary");
    expect(handoffPanel).toContain("ArchitectureDraftCloneSnapshotControl");
    expect(snapshotSummary).toContain("SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS.snapshotSummary");
  });

  it("keeps document undo disabled on spawn lock without lengthening mutation undo window", () => {
    const draftWorkspace = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx"),
      "utf8",
    );

    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);
    expect(draftWorkspace).toMatch(/documentUndoEnabled = !handoffEditorLocked/);
    expect(draftWorkspace).toMatch(/enabled:\s*!handoffEditorLocked/);
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_SPAWN_LOCK_HANDOFF_LAYOUT_DOC_ANCHOR))).toBe(true);
  });

  it("points at ADR 0071 for spawn discard and handoff contract", () => {
    const adr = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_SPAWN_LOCK_HANDOFF_LAYOUT_DOC_ANCHOR), "utf8");

    expect(adr).toContain("Spawn-locked");
    expect(adr).toContain("discard the stack");
    expect(adr).toContain("MUTATION_UNDO_WINDOW_SECONDS = 300");
  });
});
