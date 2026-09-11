import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("career-gravity prompt inventory (CG-099)", () => {
  it("includes the CG-00 index and CG-001 through CG-100 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("career-gravity-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("career-gravity-00-index.md");

    for (let promptNumber = 1; promptNumber <= 100; promptNumber += 1) {
      const prefixNum = `career-gravity-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for CG-${String(promptNumber).padStart(3, "0")}`).toHaveLength(1);
    }

    expect(files.filter((name) => /^career-gravity-\d{3}-/.test(name))).toHaveLength(100);
  });

  it("keeps a single career-gravity prompt inventory test file (CG-099)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter((name) =>
      name.startsWith("career-gravity-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["career-gravity-prompt-inventory.test.ts"]);
  });
});
