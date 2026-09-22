import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("record-practice prompt inventory (RP-021)", () => {
  it("includes the RP-00 index and RP-001 through RP-024 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("record-practice-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("record-practice-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefixNum = `record-practice-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for RP-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^record-practice-\d{3}-/.test(name))).toHaveLength(24);
  });
});
