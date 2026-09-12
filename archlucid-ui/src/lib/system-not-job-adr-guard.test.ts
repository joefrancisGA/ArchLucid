import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_ADR_0092_ACCEPTED_STATUSES,
  SYSTEM_NOT_JOB_ADR_0092_RELATIVE_PATH,
} from "@/lib/system-not-job-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0068_RELATIVE_PATH =
  "docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md";

describe("system-not-job ADR guard (SN-001 / ADR 0092)", () => {
  it("ADR 0092 exists, allows labeled envelope, forbids draft Compare as Career, and keeps kernels separate", () => {
    const adrPath = join(REPO_ROOT, SYSTEM_NOT_JOB_ADR_0092_RELATIVE_PATH);

    expect(existsSync(adrPath), SYSTEM_NOT_JOB_ADR_0092_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0092 must declare Proposed or Accepted status").not.toBeNull();
    expect(SYSTEM_NOT_JOB_ADR_0092_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/labeled what-if envelope/i);
    expect(adr).toMatch(/May we Compare two unsealed drafts as Career\?/);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/May Working sketch a labeled envelope\?/);
    expect(adr).toMatch(/\*\*Yes\.\*\*/);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/authority-borrowing/i);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).toMatch(/Do not.*merge.*DraftRequests.*Runs/i);
    expect(adr).toMatch(/draft-to-draft Compare/i);
    expect(adr).toMatch(/Do not.*rewrite ADR 0068/i);

    const decisionSection = adr.slice(adr.indexOf("## Decision"), adr.indexOf("## Trade-offs"));

    expect(decisionSection).toMatch(/Kernels stay two/i);
    expect(decisionSection).toMatch(/Compare unsealed drafts is forbidden/i);
    expect(decisionSection).not.toMatch(/AgentExecution:Mode` default (is|becomes) \*\*Real/i);
  });

  it("does not rewrite ADR 0068 body; 0068 still declares two kernels", () => {
    const adr0068Path = join(REPO_ROOT, ADR_0068_RELATIVE_PATH);

    expect(existsSync(adr0068Path), ADR_0068_RELATIVE_PATH).toBe(true);

    const adr0068 = readFileSync(adr0068Path, "utf8");

    expect(adr0068).toMatch(/two kernels/i);
    expect(adr0068).toMatch(/DraftRequests/);
    expect(adr0068).toMatch(/Option K/);
  });
});
