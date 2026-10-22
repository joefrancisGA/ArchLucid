import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("start-review-intake prompt inventory (SRI-06)", () => {
  it("includes the index, six implementation prompts, and the hold prompt", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("start-review-intake-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("start-review-intake-00-index.md");
    expect(files).toContain("start-review-intake-07-hold.md");

    for (let promptNumber = 1; promptNumber <= 6; promptNumber += 1) {
      const prefix = `start-review-intake-${String(promptNumber).padStart(2, "0")}-`;
      expect(files.some((name) => name.startsWith(prefix))).toBe(true);
    }

    expect(files.filter((name) => /^start-review-intake-0[1-6]-/.test(name))).toHaveLength(6);
  });
});
