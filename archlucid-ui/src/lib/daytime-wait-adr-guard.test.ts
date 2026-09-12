import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DAYTIME_WAIT_ADR_0096_ACCEPTED_STATUSES,
  DAYTIME_WAIT_ADR_0096_RELATIVE_PATH,
} from "@/lib/daytime-wait-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("daytime-wait ADR guard (DW-001 / ADR 0096)", () => {
  it("ADR 0096 is Accepted and forbids run-progress URL and fake percentComplete", () => {
    const adrPath = join(REPO_ROOT, DAYTIME_WAIT_ADR_0096_RELATIVE_PATH);

    expect(existsSync(adrPath), DAYTIME_WAIT_ADR_0096_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0096 must declare Accepted status").not.toBeNull();
    expect(DAYTIME_WAIT_ADR_0096_ACCEPTED_STATUSES).toContain(statusMatch![1]);
    expect(statusMatch![1]).toBe("Accepted");

    expect(adr).toMatch(/never owns the tab/i);
    expect(adr).toMatch(/GET \/v1\/runs\/\{runId\}\/progress/);
    expect(adr).toMatch(/percentComplete/);
    expect(adr).toMatch(/stay on this page/i);
    expect(adr).toMatch(/G-REAL-06/);
  });
});
