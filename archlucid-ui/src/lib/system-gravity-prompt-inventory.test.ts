import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");
const LIB_DIR = join(process.cwd(), "src", "lib");

describe("system-gravity prompt inventory (SG-119)", () => {
  it("includes the SG-00 index and SG-001 through SG-120 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("system-gravity-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("system-gravity-00-index.md");

    for (let promptNumber = 1; promptNumber <= 120; promptNumber += 1) {
      const prefixNum = `system-gravity-${String(promptNumber).padStart(3, "0")}-`;
      const matches = files.filter((name) => name.startsWith(prefixNum));

      expect(matches, `missing prompt file for SG-${String(promptNumber).padStart(3, "0")}`).toHaveLength(1);
    }

    expect(files.filter((name) => /^system-gravity-\d{3}-/.test(name))).toHaveLength(120);
  });

  it("keeps a single system-gravity prompt inventory test file (SG-119)", () => {
    const inventoryTests = readdirSync(LIB_DIR).filter(
      (name) => name.startsWith("system-gravity-prompt-inventory") && name.endsWith(".test.ts"),
    );

    expect(inventoryTests).toEqual(["system-gravity-prompt-inventory.test.ts"]);
  });
});
