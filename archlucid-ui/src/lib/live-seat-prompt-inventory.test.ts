import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("live-seat prompt inventory (LS-021)", () => {
  it("includes the LS-00 index and LS-001 through LS-024 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("live-seat-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("live-seat-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefixNum = `live-seat-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for LS-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^live-seat-\d{3}-/.test(name))).toHaveLength(24);
  });
});
