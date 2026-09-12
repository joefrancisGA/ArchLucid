import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_GRAVITY_ADR_0098_ACCEPTED_STATUSES,
  SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH,
} from "@/lib/system-gravity-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0077_RELATIVE_PATH =
  "docs/architecture/adrs/0077-working-architecture-is-the-locator.md";

describe("system-gravity ADR guard (SG-001 / SG-104 / ADR 0098)", () => {
  it("ADR 0098 exists, keeps kernels separate, and answers instrument FAQ", () => {
    const adrPath = join(REPO_ROOT, SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH);

    expect(existsSync(adrPath), SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0098 must declare Proposed or Accepted status").not.toBeNull();
    expect(SYSTEM_GRAVITY_ADR_0098_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/is review-detail Monday morning/i);
    expect(adr).toMatch(/\*\*No\.\*\*/);
    expect(adr).toMatch(/May we merge kernels/);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/DraftRequests.*Runs.*remain separate/i);
    expect(adr).toMatch(/Do not rewrite ADR 0077/);
  });

  it("does not rewrite ADR 0077 body; 0077 still declares architecture locator", () => {
    const adr0077Path = join(REPO_ROOT, ADR_0077_RELATIVE_PATH);

    expect(existsSync(adr0077Path), ADR_0077_RELATIVE_PATH).toBe(true);

    const adr0077 = readFileSync(adr0077Path, "utf8");

    expect(adr0077).toMatch(/architecture is the locator/i);
    expect(adr0077).toMatch(/DraftRequests/);
  });
});
