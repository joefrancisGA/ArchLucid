import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE } from "@/lib/livelihood-grade-no-semantic-not-commit-gate";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no semantic not commit gate (LN-033)", () => {
  it("documents warn-only semantic band per ADR 0085", () => {
    const adr = readFileSync(
      join(REPO_ROOT, "docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md"),
      "utf8",
    );

    expect(LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE).toMatch(/0085/);
    expect(LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE).toMatch(/LN-025/);
    expect(adr).toMatch(/warn/i);
    expect(adr).not.toMatch(/default-on/i);
  });
});
