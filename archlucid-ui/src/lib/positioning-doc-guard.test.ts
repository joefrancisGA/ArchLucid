import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POSITIONING_PATH = "docs/go-to-market/POSITIONING.md";

function readPositioningMarkdown(): string {
  return readFileSync(join(process.cwd(), "..", POSITIONING_PATH), "utf8");
}

describe("positioning-doc-guard (TB-746)", () => {
  it("documents evidence-package-first vocabulary and review-led trust ladder", () => {
    const markdown = readPositioningMarkdown();

    expect(markdown).toMatch(/Evidence-package-first vocabulary/i);
    expect(markdown).toMatch(/architecture package/i);
    expect(markdown).toMatch(/review-led/i);
    expect(markdown).toMatch(/Verbs never in the hero/i);
    expect(markdown).toMatch(/governed architecture packages/i);
    expect(markdown).not.toMatch(/prioritized, evidence-linked risk review/i);
  });
});
