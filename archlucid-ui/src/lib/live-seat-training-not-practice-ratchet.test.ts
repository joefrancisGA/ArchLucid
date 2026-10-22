import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseWorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

const UI_ROOT = join(process.cwd(), "src");

describe("live-seat Training is not Practice ratchet (LS-020)", () => {
  it("WorkingCareerRehearsalChooser exposes only Record and Practice segments", () => {
    const chooserSource = readFileSync(
      join(UI_ROOT, "components/workspace-mode/WorkingCareerRehearsalChooser.tsx"),
      "utf8",
    );

    expect(chooserSource).not.toMatch(/\btraining\b/i);
    expect(chooserSource).toContain("labelForWorkingCareerRehearsalDoor");
    expect(chooserSource).toContain("cycleWorkingCareerRehearsalDoor");
  });

  it("parseWorkingCareerRehearsalDoorId accepts only record/practice/career/rehearsal aliases", () => {
    expect(parseWorkingCareerRehearsalDoorId("training")).toBe("rehearsal");
    expect(parseWorkingCareerRehearsalDoorId("record")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("practice")).toBe("rehearsal");
  });

  it("documents Training vs Practice separation in ADR 0102", () => {
    const adrSource = readFileSync(
      join(process.cwd(), "..", "docs", "architecture", "adrs", "0102-first-login-live-workspace-explicit-training.md"),
      "utf8",
    );

    expect(adrSource).toMatch(/Training is not Practice/i);
    expect(adrSource).toMatch(/third Record\/Practice segment/i);
  });
});
