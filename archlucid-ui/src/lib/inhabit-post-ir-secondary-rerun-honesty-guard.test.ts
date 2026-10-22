import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit post-IR secondary re-run honesty guard (IP-009)", () => {
  it("mounts WorkingExecuteStartHonestyNotices next to secondary re-run buttons", () => {
    const progressTracker = readFileSync(
      join(SRC_ROOT, "components/runs/RunProgressTracker.tsx"),
      "utf8",
    );
    const qualityWarnings = readFileSync(
      join(SRC_ROOT, "components/runs/RunAgentQualityWarningsPanel.tsx"),
      "utf8",
    );

    expect(progressTracker).toContain("WorkingExecuteStartHonestyNotices");
    expect(qualityWarnings).toContain("WorkingExecuteStartHonestyNotices");
  });
});
