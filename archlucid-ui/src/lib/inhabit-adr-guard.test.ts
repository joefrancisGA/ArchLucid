import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0100_RELATIVE_PATH =
  "docs/architecture/adrs/0100-working-inhabit-architecture-findings-document.md";
const ADR_0098_RELATIVE_PATH = "docs/architecture/adrs/0098-working-instrument-after-spawn-is-desk.md";

describe("inhabit ADR guard (IH-001 / IH-072 / ADR 0100)", () => {
  it("ADR 0100 exists, keeps kernels separate, and answers inhabit FAQ", () => {
    const adrPath = join(REPO_ROOT, ADR_0100_RELATIVE_PATH);

    expect(existsSync(adrPath), ADR_0100_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0100 must declare Proposed or Accepted status").not.toBeNull();
    expect(["Proposed", "Accepted"]).toContain(statusMatch![1]);

    expect(adr).toMatch(/does the architect inhabit the architecture/i);
    expect(adr).toMatch(/\*\*Yes\.\*\*/);
    expect(adr).toMatch(/Is nested review-detail Monday morning/i);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/May we merge kernels so the job is the document/);
    expect(adr).toMatch(/May we lengthen 300s undo or unseal/);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/`DraftRequests` and `Runs` remain separate/);
    expect(adr).toMatch(/MUTATION_UNDO_WINDOW_SECONDS = 300/);
    expect(adr).toMatch(/Do not rewrite ADR 0068/);
  });

  it("does not rewrite ADR 0098 body; 0098 still declares instrument after spawn", () => {
    const adr0098Path = join(REPO_ROOT, ADR_0098_RELATIVE_PATH);

    expect(existsSync(adr0098Path), ADR_0098_RELATIVE_PATH).toBe(true);

    const adr0098 = readFileSync(adr0098Path, "utf8");

    expect(adr0098).toMatch(/instrument after spawn is the architecture desk/i);
    expect(adr0098).toMatch(/`DraftRequests` and `Runs` stay separate/);
  });
});
