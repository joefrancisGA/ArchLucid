import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("inhabit post-IR prompt inventory (IP-014)", () => {
  it("includes the IP-00 index and IP-001 through IP-015 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("inhabit-post-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("inhabit-post-00-index.md");

    for (let promptNumber = 1; promptNumber <= 15; promptNumber += 1) {
      const prefixNum = `inhabit-post-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for IP-${String(promptNumber).padStart(3, "0")}`).toHaveLength(
        1,
      );
    }

    expect(files.filter((name) => /^inhabit-post-\d{3}-/.test(name))).toHaveLength(15);
  });

  it("does not count post-IR files toward the IH-079 inhabit-NNN ratchet", () => {
    const waveFiles = readdirSync(PROMPTS_DIR).filter((name) => /^inhabit-\d{3}-/.test(name));

    expect(waveFiles).toHaveLength(80);
  });

  it("does not count post-IR files toward the IR-017 remain ratchet", () => {
    const remainFiles = readdirSync(PROMPTS_DIR).filter((name) => /^inhabit-remain-\d{3}-/.test(name));

    expect(remainFiles).toHaveLength(18);
  });

  it("keeps a single inhabit post-IR prompt inventory test file (IP-014)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter(
      (name) => name.startsWith("inhabit-post-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["inhabit-post-prompt-inventory.test.ts"]);
  });
});
