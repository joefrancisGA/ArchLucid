import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_ADR_0092_ACCEPTED_STATUSES,
  CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH,
} from "@/lib/cheap-exploration-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("cheap-exploration ADR guard (CE-001 / ADR 0092)", () => {
  it("ADR 0092 is Accepted and forbids draft Compare as Career proof", () => {
    const adrPath = join(REPO_ROOT, CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH);

    expect(existsSync(adrPath), CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0092 must declare Accepted status").not.toBeNull();
    expect(CHEAP_EXPLORATION_ADR_0092_ACCEPTED_STATUSES).toContain(statusMatch![1]);
    expect(statusMatch![1]).toBe("Accepted");

    expect(adr).toMatch(/labeled what-if envelope/i);
    expect(adr).toMatch(/May we Compare two unsealed drafts as Career\?/);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/G-REAL-06/);
  });
});
