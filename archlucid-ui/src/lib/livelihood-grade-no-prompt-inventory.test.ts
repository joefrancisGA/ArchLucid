import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("livelihood-grade-no prompt inventory (LN-032)", () => {
  it("includes the LN-00 index and LN-001 through LN-040 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("livelihood-grade-no-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("livelihood-grade-no-00-index.md");

    for (let promptNumber = 1; promptNumber <= 40; promptNumber += 1) {
      const prefixNum = `livelihood-grade-no-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for LN-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^livelihood-grade-no-\d{3}-/.test(name))).toHaveLength(40);
  });
});
