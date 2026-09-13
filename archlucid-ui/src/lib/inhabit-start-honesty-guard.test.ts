import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit start honesty guard (IH-025 / IH-026 / IH-075)", () => {
  it("wires Record + Simulator and Practice start honesty near Working Start review surfaces", () => {
    const draftFooter = readFileSync(
      join(SRC_ROOT, "components/architecture/ArchitectureDraftWorkspaceStartReviewFooter.tsx"),
      "utf8",
    );
    const commandBar = readFileSync(
      join(SRC_ROOT, "components/architecture/ArchitectureIdentityDeskCommandBar.tsx"),
      "utf8",
    );

    const notice = readFileSync(
      join(SRC_ROOT, "components/governance/WorkingRecordSimulatorStartHonestyNotice.tsx"),
      "utf8",
    );

    const practiceNotice = readFileSync(
      join(SRC_ROOT, "components/governance/WorkingPracticeStartHonestyNotice.tsx"),
      "utf8",
    );

    expect(draftFooter).toContain("WorkingRecordSimulatorStartHonestyNotice");
    expect(draftFooter).toContain("WorkingPracticeStartHonestyNotice");
    expect(commandBar).toContain("WorkingRecordSimulatorStartHonestyNotice");
    expect(commandBar).toContain("WorkingPracticeStartHonestyNotice");
    expect(notice).toContain("working-record-simulator-start-honesty");
    expect(practiceNotice).toContain("working-practice-start-honesty");
  });
});
