import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("inhabit remain prompt inventory (IR-017)", () => {
  it("includes the IR-00 index and IR-001 through IR-018 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("inhabit-remain-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("inhabit-remain-00-index.md");

    for (let promptNumber = 1; promptNumber <= 18; promptNumber += 1) {
      const prefixNum = `inhabit-remain-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for IR-${String(promptNumber).padStart(3, "0")}`).toHaveLength(
        1,
      );
    }

    expect(files.filter((name) => /^inhabit-remain-\d{3}-/.test(name))).toHaveLength(18);
  });

  it("does not count remain files toward the IH-079 inhabit-NNN ratchet", () => {
    const waveFiles = readdirSync(PROMPTS_DIR).filter((name) => /^inhabit-\d{3}-/.test(name));

    expect(waveFiles).toHaveLength(80);
  });

  it("keeps a single inhabit remain prompt inventory test file (IR-017)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter(
      (name) => name.startsWith("inhabit-remain-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["inhabit-remain-prompt-inventory.test.ts"]);
  });
});
