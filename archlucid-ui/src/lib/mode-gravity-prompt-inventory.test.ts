import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("mode-gravity prompt inventory (MG-024)", () => {
  it("includes the MG-00 index and MG-001 through MG-024 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("mode-gravity-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("mode-gravity-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefixNum = `mode-gravity-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for MG-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^mode-gravity-\d{3}-/.test(name))).toHaveLength(24);
  });
});
