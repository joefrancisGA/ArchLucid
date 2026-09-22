import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveSystemNotJobCloneFromSnapshotConfirmCopy,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DOC_ANCHOR,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-008 clone-from-snapshot working path", () => {
  it("uses the desk CTA label Sketch a change", () => {
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL).toBe("Sketch a change");
  });

  it("names Practice stamp, CG door rules, and SN-009 cap pointer in confirm copy", () => {
    const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
      effectiveDoor: "rehearsal",
    });

    expect(copy.title).toBe("Start new version from snapshot?");
    expect(copy.description).toContain("Practice");
    expect(copy.description).toContain("CG door rules");
    expect(copy.description).toContain("ADR 0092");
    expect(copy.description).toContain("what-if branch cap");
    expect(copy.description).toContain("parent snapshot");
  });

  it("names Record review type in confirm copy when selected", () => {
    const copy = resolveSystemNotJobCloneFromSnapshotConfirmCopy({
      effectiveDoor: "career",
    });

    expect(copy.description).toContain("Record");
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
