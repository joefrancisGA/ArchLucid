import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_ADR_0091_ACCEPTED_STATUSES,
  CAREER_GRAVITY_ADR_0091_RELATIVE_PATH,
} from "@/lib/career-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0086_RELATIVE_PATH = "docs/architecture/adrs/0086-working-career-vs-rehearsal-doors.md";

describe("career-gravity ADR guard (CG-001 / ADR 0091)", () => {
  it("ADR 0091 exists, forbids unlabeled Simulator as the Working day, and does not flip host Mode or merge kernels", () => {
    const adrPath = join(REPO_ROOT, CAREER_GRAVITY_ADR_0091_RELATIVE_PATH);

    expect(existsSync(adrPath), CAREER_GRAVITY_ADR_0091_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0091 must declare Accepted status").not.toBeNull();
    expect(CAREER_GRAVITY_ADR_0091_ACCEPTED_STATUSES).toContain(statusMatch![1]);
    expect(statusMatch![1]).toBe("Accepted");

    expect(adr).toMatch(/Career is the Working default execute gravity/i);
    expect(adr).toMatch(/Is Simulator the unlabeled Working day\?/);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/authority-borrowing/i);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).toMatch(/Do not.*flip.*AgentExecution:Mode/i);
    expect(adr).toMatch(/Do not.*merge.*DraftRequests.*Runs/i);
    expect(adr).toMatch(/Do not.*rewrite ADR 0086/i);

    const decisionSection = adr.slice(adr.indexOf("## Decision"), adr.indexOf("## Trade-offs"));

    expect(decisionSection).toMatch(/Host Mode default unchanged/i);
    expect(decisionSection).toMatch(/No G-REAL-06/);
    expect(decisionSection).not.toMatch(/AgentExecution:Mode` default (is|becomes) \*\*Real/i);
  });

  it("does not rewrite ADR 0086 body; 0086 still forbids a host Mode flip", () => {
    const adr0086Path = join(REPO_ROOT, ADR_0086_RELATIVE_PATH);

    expect(existsSync(adr0086Path), ADR_0086_RELATIVE_PATH).toBe(true);

    const adr0086 = readFileSync(adr0086Path, "utf8");

    expect(adr0086).toMatch(/Host Mode default unchanged/);
    expect(adr0086).toMatch(/G-REAL-06/);
    expect(adr0086).toMatch(/ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests/);
  });
});
