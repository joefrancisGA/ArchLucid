import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("desk-ia wave close audit (DI-024)", () => {
  it("documents acceptance markdown and ADR 0095", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/DESK_IA_ACCEPTANCE_2026-09-11.md"),
      "utf8",
    );
    const adr = readFileSync(
      join(REPO_ROOT, "docs/architecture/adrs/0095-sealed-record-governance-home.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Governance nav includes ledger/i);
    expect(acceptance).toMatch(/Desktop tabs.*not behind \*\*More\*\*/i);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(adr).toMatch(/0095/);
    expect(adr).toMatch(/sealed review records/i);
  });
});
