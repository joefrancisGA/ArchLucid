import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_SPINE_ADR_0086_ACCEPTED_STATUSES,
  ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH,
} from "@/lib/architecture-spine-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("architecture-spine ADR guard (AS-076 / ADR 0086)", () => {
  it("ADR 0086 is Accepted and forbids host Mode flip", () => {
    const adrPath = join(REPO_ROOT, ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH);

    expect(existsSync(adrPath), ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0086 must declare Accepted status").not.toBeNull();
    expect(ARCHITECTURE_SPINE_ADR_0086_ACCEPTED_STATUSES).toContain(statusMatch![1]);
    expect(statusMatch![1]).toBe("Accepted");

    expect(adr).toMatch(/Career/);
    expect(adr).toMatch(/Rehearsal/);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).toMatch(/Do not.*flip.*AgentExecution:Mode/i);
  });
});
