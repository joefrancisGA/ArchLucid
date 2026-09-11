import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("career-gravity prompt inventory (CG-100)", () => {
  it("includes the CG-00 index and CG-001 through CG-100 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("career-gravity-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("career-gravity-00-index.md");

    for (let promptNumber = 1; promptNumber <= 100; promptNumber += 1) {
      const prefixNum = `career-gravity-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for CG-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^career-gravity-\d{3}-/.test(name))).toHaveLength(100);
  });
});
