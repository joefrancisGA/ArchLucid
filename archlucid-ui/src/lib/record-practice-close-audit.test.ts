import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("record-practice wave close audit (RP-024)", () => {
  it("documents acceptance markdown and ADR 0097 Accepted", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/RECORD_PRACTICE_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/RECORD_PRACTICE_USER_COPY_INVENTORY.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Record \| Practice/);
    expect(acceptance).toMatch(/stored tokens stay/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(inventory).toContain("working-career-rehearsal-door-copy.ts");
    expect(inventory).toContain("career");
    expect(inventory).toContain("rehearsal");
  });
});
