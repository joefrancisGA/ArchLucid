import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("daytime-wait wave close audit (DW-024)", () => {
  it("documents acceptance markdown and ADR 0096 Accepted", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/DAYTIME_WAIT_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/DAYTIME_WAIT_EXECUTE_INVENTORY.md"),
      "utf8",
    );
    const adr = readFileSync(
      join(REPO_ROOT, "docs/architecture/adrs/0096-career-real-never-owns-the-tab.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/operations poll/i);
    expect(acceptance).toMatch(/stay on this page/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(inventory).toContain("daytime-wait-operations-poll-inventory.ts");
    expect(inventory).toContain("first-week-route-guidance.ts");

    expect(adr).toMatch(/\*\*Status:\*\*\s*Accepted/);
  });
});
