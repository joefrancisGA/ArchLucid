import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveSystemNotJobCloneFromSnapshotConfirmCopy,
  resolveSystemNotJobCloneFromSnapshotFullRunCostSentence,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DOC_ANCHOR,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-008 clone-from-snapshot working path", () => {
  it("uses the desk CTA label New version (clone)", () => {
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL).toBe("New version (clone)");
  });

  it("names Rehearsal stamp, CG door rules, and full-run cost in confirm copy", () => {
    const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
      effectiveDoor: "rehearsal",
      quotaSummary: null,
    });

    expect(copy.title).toBe("Start new version from snapshot?");
    expect(copy.description).toContain("Rehearsal");
    expect(copy.description).toContain("CG door rules");
    expect(copy.description).toContain("ADR 0092");
    expect(copy.description).toContain(resolveSystemNotJobCloneFromSnapshotFullRunCostSentence());
    expect(copy.description).toContain("parent snapshot");
  });

  it("prefers branch quota summary when provided", () => {
    const quotaSummary = "Branches used: 1/3 · 2 remaining · each submit runs one billable architecture package (full pipeline; ~$4.50 estimated AI spend).";
    const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
      effectiveDoor: "career",
      quotaSummary,
    });

    expect(copy.description).toContain("Career");
    expect(copy.description).toContain(quotaSummary);
    expect(copy.description).not.toContain(resolveSystemNotJobCloneFromSnapshotFullRunCostSentence());
  });

  it("anchors spawn-lock palette discovery test id", () => {
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID).toBe(
      "architecture-spawn-lock-clone-snapshot",
    );
  });

  it("points at ADR 0092 for cheap envelope policy", () => {
    const adr = readFileSync(join(repoRoot, SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DOC_ANCHOR), "utf8");

    expect(adr).toContain("SN-008");
    expect(adr).toContain("clone-from-snapshot");
  });
});
