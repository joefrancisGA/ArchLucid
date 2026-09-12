import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LIVELIHOOD_GRADE_NO_NO_40TH_ENGINE_ACCEPTANCE_LINE } from "@/lib/livelihood-grade-no-no-40th-engine-ratchet";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no no 40th engine ratchet (LN-020)", () => {
  it("references HOLD_NO_COVERAGE_ENGINES authority", () => {
    const hold = readFileSync(
      join(REPO_ROOT, "docs/quality/HOLD_NO_COVERAGE_ENGINES.md"),
      "utf8",
    );

    expect(LIVELIHOOD_GRADE_NO_NO_40TH_ENGINE_ACCEPTANCE_LINE).toMatch(/40th/);
    expect(hold).toMatch(/no new coverage engine/i);
  });
});
