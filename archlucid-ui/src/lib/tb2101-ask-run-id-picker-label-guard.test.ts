/**
 * TB-2101 — AskRunIdPicker label must not append “(pick an architecture review)”.
 * Empty guidance stays on the Select placeholder.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PICKER = join(process.cwd(), "src/components/AskRunIdPicker.tsx");

describe("TB-2101 AskRunIdPicker label parenthetical", () => {
  it("forbids pick-an-architecture-review on the label path", () => {
    const source = readFileSync(PICKER, "utf8");

    expect(source).not.toContain("(pick an architecture review)");
    expect(source).toContain('placeholder="Choose an architecture review"');
    expect(source).toContain('data-testid="ask-run-id-picker-label"');
  });
});
