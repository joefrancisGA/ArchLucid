import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PROMPTS_DIR = join(process.cwd(), "..", ".cursor", "prompts");

describe("desk-ia prompt inventory (DI-024)", () => {
  it("includes the DI-00 index and DI-001 through DI-024 paste-ready files", () => {
    const files = readdirSync(PROMPTS_DIR)
      .filter((name) => name.startsWith("desk-ia-") && name.endsWith(".md"))
      .sort();

    expect(files).toContain("desk-ia-00-index.md");

    for (let promptNumber = 1; promptNumber <= 24; promptNumber += 1) {
      const prefixNum = `desk-ia-${String(promptNumber).padStart(3, "0")}-`;
      const match = files.find((name) => name.startsWith(prefixNum));

      expect(match, `missing prompt file for DI-${String(promptNumber).padStart(3, "0")}`).toBeDefined();
    }

    expect(files.filter((name) => /^desk-ia-\d{3}-/.test(name))).toHaveLength(24);
  });
});
