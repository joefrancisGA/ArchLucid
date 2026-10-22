import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("inhabit prompt inventory (IH-079)", () => {
  it("includes the IH-00 index and IH-001 through IH-080 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("inhabit-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("inhabit-00-index.md");

    for (let promptNumber = 1; promptNumber <= 80; promptNumber += 1) {
      const prefixNum = `inhabit-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for IH-${String(promptNumber).padStart(3, "0")}`).toHaveLength(
        1,
      );
    }

    expect(files.filter((name) => /^inhabit-\d{3}-/.test(name))).toHaveLength(80);
  });

  it("keeps a single inhabit prompt inventory test file (IH-079)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter(
      (name) => name.startsWith("inhabit-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["inhabit-prompt-inventory.test.ts"]);
  });
});
