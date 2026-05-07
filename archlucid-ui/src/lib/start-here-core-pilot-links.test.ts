import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Locks Start-here → Core pilot navigation promises (improvement #2).
 */
describe("START_HERE core pilot links", () => {
  const startHere = readFileSync(
    resolve(__dirname, "../../../docs/START_HERE.md"),
    "utf8",
  );

  it("routes first session to CORE_PILOT first-session anchor", () => {
    expect(startHere).toMatch(/\[CORE_PILOT\.md\]\(CORE_PILOT\.md#first-session-checklist\)/);
  });

  it("keeps executive brief on the four-step path", () => {
    expect(startHere).toMatch(/EXECUTIVE_SPONSOR_BRIEF\.md/);
  });
});
