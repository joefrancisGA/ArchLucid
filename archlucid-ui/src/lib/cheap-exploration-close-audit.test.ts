import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("cheap-exploration wave close audit (CE-040)", () => {
  it("documents acceptance markdown and ADR 0092 Accepted", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/CHEAP_EXPLORATION_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/CHEAP_EXPLORATION_INVENTORY.md"),
      "utf8",
    );
    const adr = readFileSync(
      join(REPO_ROOT, "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Sketch a change/i);
    expect(acceptance).toMatch(/Rehearsal/i);
    expect(acceptance).toMatch(/no draft-diff/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(inventory).toContain("cheap-exploration-envelope-runner-entry.ts");
    expect(inventory).toContain("system-not-job-clone-from-snapshot-entry.ts");

    expect(adr).toMatch(/\*\*Status:\*\*\s*Accepted/);
  });
});
