import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_ARTIFACT_HONESTY_ADR_0078_ACCEPTED_STATUSES,
  CAREER_ARTIFACT_HONESTY_ADR_0078_RELATIVE_PATH,
} from "@/lib/career-artifact/career-artifact-honesty-contract-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-artifact-honesty-contract guard (FC-01 / ADR 0078)", () => {
  it("ADR 0078 career artifact honesty contract exists with Proposed or Accepted status", () => {
    const adrPath = join(REPO_ROOT, CAREER_ARTIFACT_HONESTY_ADR_0078_RELATIVE_PATH);

    expect(existsSync(adrPath), CAREER_ARTIFACT_HONESTY_ADR_0078_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/career artifact honesty contract/i);
    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0078 must declare Proposed or Accepted status").not.toBeNull();
    expect(CAREER_ARTIFACT_HONESTY_ADR_0078_ACCEPTED_STATUSES).toContain(statusMatch![1]);
  });
});
