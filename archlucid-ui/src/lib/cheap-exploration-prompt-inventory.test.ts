import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("cheap-exploration prompt inventory (CE-040)", () => {
  it("includes the CE-00 index and CE-001 through CE-040 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("cheap-exploration-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("cheap-exploration-00-index.md");

    for (let promptNumber = 1; promptNumber <= 40; promptNumber += 1) {
      const prefixNum = `cheap-exploration-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for CE-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^cheap-exploration-\d{3}-/.test(name))).toHaveLength(40);
  });
});
