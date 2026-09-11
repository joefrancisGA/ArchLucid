import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY_DOC_PATH,
  SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE,
  SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS,
} from "@/lib/system-not-job-dual-editor-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const HANDOFF_GATE_PATH = "archlucid-ui/src/lib/architecture/architecture-draft-handoff-gate.ts";
const DRAFT_WORKSPACE_HOOK_PATH = "archlucid-ui/src/hooks/use-architecture-draft-workspace.ts";

describe("system-not-job dual editor inventory (SN-002)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY_DOC_PATH), "utf8");

    expect(markdown).toMatch(/ADR \*\*0092\*\*/);
    expect(markdown).toMatch(/IA-007 leftover/);
    expect(markdown).toMatch(/Spawn-locked\?/);
    expect(markdown).toMatch(/architecture-draft-handoff-gate/);

    for (const row of SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS) {
      expect(markdown).toContain(row.field);
    }
  });

  it("anchors spawn-lock to architecture-draft-handoff-gate and handoffEditorLocked", () => {
    const handoffGate = readFileSync(join(REPO_ROOT, HANDOFF_GATE_PATH), "utf8");
    const workspaceHook = readFileSync(join(REPO_ROOT, DRAFT_WORKSPACE_HOOK_PATH), "utf8");

    expect(handoffGate).toContain("architectureDraftSpawnedRunId");
    expect(workspaceHook).toContain("handoffEditorLocked = linkedReviewId !== null");
    expect(existsSync(join(REPO_ROOT, HANDOFF_GATE_PATH))).toBe(true);
  });

  it("keeps parallel-live-edit rows at or below baseline and lists guided-intake alternate writer", () => {
    const parallelRows = SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS.filter(
      (row) => row.parallelLiveEditAfterSpawn,
    );

    expect(parallelRows.length).toBeLessThanOrEqual(
      SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE,
    );
    expect(parallelRows).toHaveLength(SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE);

    const alternateWriter = parallelRows[0];

    expect(alternateWriter.field).toBe("editSourceGuidedIntakeRerun");
    expect(alternateWriter.parallelClass).toBe("alternate-writer");
    expect(alternateWriter.ownerPrompt).toBe("SN-003");
  });

  it("locks all synthesis narrative PATCH fields when spawnedRunId is set", () => {
    const narrativeFields = [
      "systemName",
      "freeTextIntent",
      "businessOutcome",
      "structuredBrief",
      "openQuestions",
      "actorSet",
      "autosavePatch",
    ];

    for (const field of narrativeFields) {
      const row = SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS.find((entry) => entry.field === field);

      expect(row, field).toBeDefined();
      expect(row!.spawnLocked).toBe(true);
      expect(row!.parallelLiveEditAfterSpawn).toBe(false);
    }
  });
});
