import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SEMANTIC_SUPPORT_BAND_ADR_0085_ACCEPTED_STATUSES,
  SEMANTIC_SUPPORT_BAND_ADR_0085_RELATIVE_PATH,
  SEMANTIC_SUPPORT_BAND_VALUES,
} from "@/lib/semantic-support-band-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("semantic support band ADR guard (AS-056 / ADR 0085)", () => {
  it("ADR 0085 exists and forbids semantic legal truth and RAG support-ratio commit gate", () => {
    const adrPath = join(REPO_ROOT, SEMANTIC_SUPPORT_BAND_ADR_0085_RELATIVE_PATH);

    expect(existsSync(adrPath), SEMANTIC_SUPPORT_BAND_ADR_0085_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0085 must declare Proposed or Accepted status").not.toBeNull();
    expect(SEMANTIC_SUPPORT_BAND_ADR_0085_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    for (const band of SEMANTIC_SUPPORT_BAND_VALUES) {
      expect(adr).toContain(band);
    }

    expect(adr).toMatch(/TB-1228/i);
    expect(adr).toMatch(/ADR 0082/i);
    expect(adr).toMatch(/warn/i);
    expect(adr).toMatch(/does not block/i);

    expect(adr).toMatch(/may we block seal on LLM faithfulness/i);
    expect(adr).toMatch(/\*\*No\*\*/);

    expect(adr).toMatch(/not.*legal truth/i);
    expect(adr).toMatch(/not.*commit gate/i);
    expect(adr).not.toMatch(/RAG support-ratio is the (default )?commit gate/i);
    expect(adr).not.toMatch(/semantic support band is legal truth/i);

    expect(adr).toMatch(/insight-density/i);
    expect(adr).toMatch(/not.*fused/i);
  });
});
