import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { architectureDraftAutosavePatchBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import {
  ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER,
  resolveArchitectureTabEditSourceHrefFromRunSummary,
} from "@/lib/architecture/architecture-draft-spawn-one-writer";
import {
  SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE,
  SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS,
} from "@/lib/system-not-job-dual-editor-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const EVIDENCE_PATH =
  "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-presentation-evidence.ts";
const TABBED_WORKSPACE_PATH =
  "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-run-detail-tabbed-workspace.tsx";
const DRAFT_WORKSPACE_PATH = "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx";
const DRAFT_WORKSPACE_HOOK_PATH = "archlucid-ui/src/hooks/use-architecture-draft-workspace.ts";

describe("system-not-job spawn one writer (SN-004)", () => {
  it("closes parallel-live-edit inventory baseline to zero", () => {
    const parallelRows = SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS.filter(
      (row) => row.parallelLiveEditAfterSpawn,
    );

    expect(SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE).toBe(0);
    expect(parallelRows).toHaveLength(0);
  });

  it("marks guided-intake edit source as read-only snapshot for Created-origin", () => {
    const row = SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS.find((entry) => entry.field === "editSourceGuidedIntakeRerun");

    expect(row).toBeDefined();
    expect(row!.parallelLiveEditAfterSpawn).toBe(false);
    expect(row!.parallelClass).toBe("read-only-snapshot");
    expect(row!.ownerPrompt).toBe("SN-004");
  });

  it("wires one-writer helpers into run detail evidence presentation", () => {
    const evidence = readFileSync(join(REPO_ROOT, EVIDENCE_PATH), "utf8");
    const tabbedWorkspace = readFileSync(join(REPO_ROOT, TABBED_WORKSPACE_PATH), "utf8");

    expect(evidence).toContain("resolveArchitectureTabEditSourceHrefFromRunSummary");
    expect(evidence).toContain("resolveArchitectureTabSubmittedHelperText");
    expect(tabbedWorkspace).toContain("resolveArchitectureTabCanEditSource");
    expect(
      resolveArchitectureTabEditSourceHrefFromRunSummary(
        { runId: "run-created", projectId: "default", packageOrigin: "Created" },
        false,
      ),
    ).toBeNull();
  });

  it("anchors spawn-locked draft autosave off and surfaces PATCH 409 copy", () => {
    const draftWorkspace = readFileSync(join(REPO_ROOT, DRAFT_WORKSPACE_PATH), "utf8");
    const workspaceHook = readFileSync(join(REPO_ROOT, DRAFT_WORKSPACE_HOOK_PATH), "utf8");

    expect(draftWorkspace).toMatch(/enabled:\s*!handoffEditorLocked/);
    expect(workspaceHook).toContain("handoffEditorLocked = linkedReviewId !== null");
    expect(existsSync(join(REPO_ROOT, "archlucid-ui/src/lib/architecture/architecture-draft-spawn-one-writer.ts"))).toBe(
      true,
    );
    expect(architectureDraftAutosavePatchBlockedReason({
      message: "Conflict",
      problem: {
        title: "Conflict",
        status: 409,
        detail: "Draft 'draft-001' sealed manifest hash verification failed before autosave.",
      },
      correlationId: "corr-sealed-409",
      httpStatus: 409,
      retryAfterSeconds: null,
    })).toContain("autosave");
  });

  it("declares Architecture tab snapshot helper copy", () => {
    expect(ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER).toMatch(/Review snapshot/i);
    expect(ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER).toMatch(/clone/i);
  });
});
