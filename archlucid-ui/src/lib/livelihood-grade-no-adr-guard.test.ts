import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_ADR_0093_ACCEPTED_STATUSES,
  LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH,
} from "@/lib/livelihood-grade-no-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");
const ADR_0050_RELATIVE_PATH =
  "docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md";

describe("livelihood-grade-no ADR guard (LN-001 / ADR 0093)", () => {
  it("ADR 0093 exists, extends R5/0050, forbids uncited hard on Working Career, and keeps 0082 separate", () => {
    const adrPath = join(REPO_ROOT, LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH);

    expect(existsSync(adrPath), LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0093 must declare Proposed or Accepted status").not.toBeNull();
    expect(LIVELIHOOD_GRADE_NO_ADR_0093_ACCEPTED_STATUSES).toContain(statusMatch![1]);
    expect(statusMatch![1]).toBe("Accepted");

    expect(adr).toMatch(/hard infeasible/i);
    expect(adr).toMatch(/citation/i);
    expect(adr).toMatch(/Does not replace 0082/i);
    expect(adr).toMatch(/40th engine/i);
    expect(adr).toMatch(/G-REAL-06/);
    expect(adr).toMatch(/security/i);
  });

  it("ADR 0093 points at ADR 0050 feasibility hard citation baseline", () => {
    const adr0050 = readFileSync(join(REPO_ROOT, ADR_0050_RELATIVE_PATH), "utf8");

    expect(adr0050).toMatch(/hard/i);
    expect(adr0050).toMatch(/citation/i);
  });
});
