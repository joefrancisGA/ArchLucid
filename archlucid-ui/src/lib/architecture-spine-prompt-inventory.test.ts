import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("architecture-spine prompt inventory (AS-100)", () => {
  it("includes the AS-00 index and AS-001 through AS-100 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("architecture-spine-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("architecture-spine-00-index.md");

    for (let promptNumber = 1; promptNumber <= 100; promptNumber += 1) {
      const prefix = `architecture-spine-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefix));

      expect(match, `missing prompt file for AS-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^architecture-spine-\d{3}-/.test(name))).toHaveLength(100);
  });
});
