import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MODE_GRAVITY_ADR_0094_ACCEPTED_STATUSES,
  MODE_GRAVITY_ADR_0094_RELATIVE_PATH,
} from "@/lib/mode-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0091_RELATIVE_PATH = "docs/architecture/adrs/0091-career-is-working-default-day.md";

describe("mode-gravity ADR guard (MG-001 / ADR 0094)", () => {
  it("ADR 0094 exists, forbids operator-experience as gravity, and does not flip host Mode or delete Guided", () => {
    const adrPath = join(REPO_ROOT, MODE_GRAVITY_ADR_0094_RELATIVE_PATH);

    expect(existsSync(adrPath), MODE_GRAVITY_ADR_0094_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0094 must declare Proposed or Accepted status").not.toBeNull();
    expect(MODE_GRAVITY_ADR_0094_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/one execute gravity/i);
    expect(adr).toMatch(/Is operator-experience a Career door\?/);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/density/i);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).toMatch(/Do not.*flip.*AgentExecution:Mode/i);
    expect(adr).toMatch(/Do not.*delete Guided/i);
    expect(adr).not.toMatch(/Do not.*rewrite ADR 0091/i);

    const decisionSection = adr.slice(adr.indexOf("## Decision"), adr.indexOf("## Trade-offs"));

    expect(decisionSection).toMatch(/Host Mode default unchanged/i);
    expect(decisionSection).toMatch(/Guided/i);
    expect(decisionSection).not.toMatch(/AgentExecution:Mode` default (is|becomes) \*\*Real/i);
  });

  it("does not rewrite ADR 0091; 0091 still owns Career default day", () => {
    const adr0091Path = join(REPO_ROOT, ADR_0091_RELATIVE_PATH);

    expect(existsSync(adr0091Path), ADR_0091_RELATIVE_PATH).toBe(true);

    const adr0091 = readFileSync(adr0091Path, "utf8");

    expect(adr0091).toMatch(/Career is the Working default execute gravity/i);
    expect(adr0091).toMatch(/G-REAL-06/);
  });
});
