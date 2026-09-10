import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("livelihood-proof prompt inventory (LP-20)", () => {
  it("includes the LP-00 index and LP-01 through LP-20 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("livelihood-proof-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("livelihood-proof-00-index.md");

    for (let promptNumber = 1; promptNumber <= 20; promptNumber += 1) {
      const prefix = `livelihood-proof-${String(promptNumber).padStart(2, "0")}-`;
      const match = files.find((name) => name.startsWith(prefix));

      expect(match, `missing prompt file for LP-${String(promptNumber).padStart(2, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^livelihood-proof-\d{2}-/.test(name))).toHaveLength(21);
  });
});
