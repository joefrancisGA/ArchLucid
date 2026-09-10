import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_REVIEW_INPUTS_ADR_0084_ACCEPTED_STATUSES,
  ARCHITECTURE_REVIEW_INPUTS_ADR_0084_RELATIVE_PATH,
} from "@/lib/architecture-review-inputs-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("architecture review inputs ADR guard (AS-001 / ADR 0084)", () => {
  it("ADR 0084 exists with Proposed or Accepted status and forbids vision default-on and DraftRequests/Runs merge", () => {
    const adrPath = join(REPO_ROOT, ARCHITECTURE_REVIEW_INPUTS_ADR_0084_RELATIVE_PATH);

    expect(existsSync(adrPath), ARCHITECTURE_REVIEW_INPUTS_ADR_0084_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/structured diagrams/i);
    expect(adr).toMatch(/bound inventory/i);
    expect(adr).toMatch(/NotVerifiable/i);
    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0084 must declare Proposed or Accepted status").not.toBeNull();
    expect(ARCHITECTURE_REVIEW_INPUTS_ADR_0084_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/default off/i);
    expect(adr).toMatch(/opt-in only/i);

    const decisionSection = adr.slice(
      adr.indexOf("## Decision"),
      adr.indexOf("## Trade-offs"),
    );

    expect(decisionSection).not.toMatch(/vision\/ocr extract is default[\s-]*on/i);

    expect(adr).toMatch(/Do not.*merge.*DraftRequests.*Runs/i);
    expect(adr).not.toMatch(/merge `DraftRequests` and `Runs` into a single/i);
  });
});
