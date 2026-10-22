import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOC_ANCHOR,
  CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL,
  cheapExplorationArchitectureDeskHref,
} from "@/lib/cheap-exploration-envelope-runner-entry";
import { SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL } from "@/lib/system-not-job-clone-from-snapshot-entry";

describe("cheap-exploration envelope runner entry (CE-001)", () => {
  it("exports Sketch a change desk CTA aligned with SN clone control", () => {
    expect(CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL).toBe("Sketch a change");
    expect(SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL).toBe(
      CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL,
    );
  });

  it("points at ADR 0092 and builds architecture desk href", () => {
    expect(CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOC_ANCHOR).toContain("0092-working-cheap-what-if-envelope");
    expect(cheapExplorationArchitectureDeskHref("arch-001")).toBe(
      "/architecture/architectures/arch-001",
    );
  });
});
