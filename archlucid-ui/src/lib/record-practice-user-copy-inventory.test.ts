import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("record-practice user copy inventory (RP-002)", () => {
  it("inventory markdown cites P0 modules and must-not-change tokens", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, "docs/architecture/RECORD_PRACTICE_USER_COPY_INVENTORY.md"),
      "utf8",
    );

    expect(markdown).toContain("0097");
    expect(markdown).toContain("Record / Practice");
    expect(markdown).toContain("WorkingCareerRehearsalDoor");
    expect(markdown).toContain("career-rehearsal-doors");
  });
});
