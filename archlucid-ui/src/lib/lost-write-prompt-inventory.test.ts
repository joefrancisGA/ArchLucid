import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("lost-write prompt inventory (LW-100)", () => {
  it("includes the LW-00 index and LW-001 through LW-100 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("lost-write-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("lost-write-00-index.md");

    for (let promptNumber = 1; promptNumber <= 100; promptNumber += 1) {
      const prefix = `lost-write-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefix));

      expect(match, `missing prompt file for LW-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^lost-write-\d{3}-/.test(name))).toHaveLength(100);
  });
});
