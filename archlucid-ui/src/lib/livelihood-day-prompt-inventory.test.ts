import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("livelihood-day prompt inventory (LY-119)", () => {
  it("includes the LY-00 index and LY-001 through LY-120 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("livelihood-day-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("livelihood-day-00-index.md");

    for (let promptNumber = 1; promptNumber <= 120; promptNumber += 1) {
      const prefixNum = `livelihood-day-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for LY-${String(promptNumber).padStart(3, "0")}`).toHaveLength(1);
    }

    expect(files.filter((name) => /^livelihood-day-\d{3}-/.test(name))).toHaveLength(120);
  });

  it("keeps a single livelihood-day prompt inventory test file (LY-119)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter(
      (name) => name.startsWith("livelihood-day-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["livelihood-day-prompt-inventory.test.ts"]);
  });
});
