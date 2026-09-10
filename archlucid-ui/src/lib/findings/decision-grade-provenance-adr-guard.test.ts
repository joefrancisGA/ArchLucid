import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DECISION_GRADE_PROVENANCE_ADR_0082_ACCEPTED_STATUSES,
  DECISION_GRADE_PROVENANCE_ADR_0082_RELATIVE_PATH,
} from "@/lib/findings/decision-grade-provenance-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("decision-grade-provenance ADR guard (LP-01 / ADR 0082)", () => {
  it("ADR 0082 exists with Proposed or Accepted status and does not claim semantic faithfulness", () => {
    const adrPath = join(REPO_ROOT, DECISION_GRADE_PROVENANCE_ADR_0082_RELATIVE_PATH);

    expect(existsSync(adrPath), DECISION_GRADE_PROVENANCE_ADR_0082_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/decision-grade finding provenance fail-closed/i);
    expect(adr).toMatch(/ProvenanceKind/i);
    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0082 must declare Proposed or Accepted status").not.toBeNull();
    expect(DECISION_GRADE_PROVENANCE_ADR_0082_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/semantic faithfulness/i);
    expect(adr).not.toMatch(/semantic faithfulness (is|as) (structural )?provenance/i);
    expect(adr).not.toMatch(/proves semantic faithfulness/i);
  });
});
